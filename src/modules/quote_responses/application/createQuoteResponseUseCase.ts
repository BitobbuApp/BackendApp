import { UseCase } from "../../../shared/application/useCase";
import { QuoteResponseRepository } from "../domain/repositories/quote_response.repository";
import { PrismaQuoteResponseRepository } from "../infrastructure/persistence/PrismaQuoteResponseRepository";
import { createQuoteResponseDtoRequestSchema, quoteResponseDtoResponseSchema } from "./dtos/quote_response.dto";
import { DuplicateQuoteResponseError } from "../domain/errors/quote_response.errors";
import { RequestNotFoundError } from "../../requests/domain/errors/request.errors";
import { assertCanQuoteRequest } from "./helpers/directRequestRules";
import { PerformQuoteActionUseCase } from "./performQuoteActionUseCase";
import { prisma } from "../../../shared/infrastructure/database";
import logger from "../../../shared/infrastructure/logger";
import Joi from "joi";

interface CreateQuoteResponseDto {
    request_id: string;
    supplier_id: string;
    company_offer_id?: string | null;
    unit_price_usd: number;
    quantity: number;
    payment_condition_id?: string | null;
    delivery_method_id?: string | null;
    delivery_time?: string | null;
    notes?: string | null;
    has_guarantee?: boolean;
    status?: string;
}

export class CreateQuoteResponseUseCase extends UseCase<CreateQuoteResponseDto, any> {
    protected inputSchema: Joi.Schema = createQuoteResponseDtoRequestSchema.append({
        supplier_id: Joi.string().uuid().required()
    });
    protected outputSchema: Joi.Schema = quoteResponseDtoResponseSchema;
    private readonly quoteResponseRepository: QuoteResponseRepository;

    constructor() {
        super();
        this.quoteResponseRepository = new PrismaQuoteResponseRepository();
    }

    protected async implementation(data: CreateQuoteResponseDto): Promise<any> {
        const request = await prisma.request.findUnique({
            where: { id: data.request_id },
            select: { target_company_id: true, company_offer_id: true },
        });
        if (!request) throw new RequestNotFoundError(data.request_id);

        const isDirect = !!request.target_company_id;
        assertCanQuoteRequest(request.target_company_id, data.supplier_id);
        if (isDirect) {
            // Quote is tied to the marketplace offer and starts pending so the negotiation can open
            data.company_offer_id = request.company_offer_id;
            data.status = 'pending';
        }

        const created = await this.quoteResponseRepository.create(data);

        // Direct RFQ: the supplier's quote opens the negotiation right away (conversation + negotiating)
        let conversation_id: string | null = null;
        let status = created.status;
        if (isDirect) {
            try {
                const negotiation = await new PerformQuoteActionUseCase().execute({
                    quoteResponseId: created.id,
                    action: 'negotiation_started',
                    actorCompanyId: data.supplier_id,
                });
                status = negotiation.status;
                conversation_id = negotiation.conversation_id ?? null;
            } catch (err) {
                // The quote stays pending; the buyer can still start the negotiation manually
                logger.error(err, `Failed to auto-start negotiation for direct quote ${created.id}`);
            }
        }

        return {
            conversation_id,
            id: created.id,
            request_id: created.request_id,
            supplier_id: created.supplier_id,
            company_offer_id: created.company_offer_id,
            unit_price_usd: Number(created.unit_price_usd),
            quantity: created.quantity,
            payment_conditions: created.payment_conditions,
            delivery_time: created.delivery_time,
            notes: created.notes,
            has_guarantee: created.has_guarantee,
            status,
            rejection_reason: created.rejection_reason,
            total_amount_usd: Number(created.total_amount_usd),
            payment_condition_id: created.payment_condition_id,
            delivery_method_id: created.delivery_method_id,
            created_at: created.created_at,
        };
    }
}
