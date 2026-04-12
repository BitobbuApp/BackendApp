import { UseCase } from "../../../shared/application/useCase";
import { QuoteResponseRepository } from "../domain/repositories/quote_response.repository";
import { PrismaQuoteResponseRepository } from "../infrastructure/persistence/PrismaQuoteResponseRepository";
import { createQuoteResponseDtoRequestSchema, quoteResponseDtoResponseSchema } from "./dtos/quote_response.dto";
import { DuplicateQuoteResponseError } from "../domain/errors/quote_response.errors";
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
        const created = await this.quoteResponseRepository.create(data);
        return {
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
            status: created.status,
            rejection_reason: created.rejection_reason,
            total_amount_usd: Number(created.total_amount_usd),
            payment_condition_id: created.payment_condition_id,
            delivery_method_id: created.delivery_method_id,
            created_at: created.created_at,
        };
    }
}
