import { UseCase } from "../../../shared/application/useCase";
import { QuoteResponseRepository } from "../domain/repositories/quote_response.repository";
import { PrismaQuoteResponseRepository } from "../infrastructure/persistence/PrismaQuoteResponseRepository";
import { QuoteResponseNotFoundError } from "../domain/errors/quote_response.errors";
import { updateQuoteResponseDtoRequestSchema, quoteResponseDtoResponseSchema } from "./dtos/quote_response.dto";
import Joi from "joi";

interface UpdateQuoteResponseDto {
    id: string;
    company_offer_id?: string | null;
    unit_price?: number;
    quantity?: number;
    payment_condition_id?: string | null;
    delivery_method_id?: string | null;
    delivery_time?: string | null;
    notes?: string | null;
    has_guarantee?: boolean;
    status?: string;
    rejection_reason?: string | null;
}

export class UpdateQuoteResponseUseCase extends UseCase<UpdateQuoteResponseDto, any> {
    protected inputSchema: Joi.Schema = updateQuoteResponseDtoRequestSchema;
    protected outputSchema: Joi.Schema = quoteResponseDtoResponseSchema;
    private readonly quoteResponseRepository: QuoteResponseRepository;

    constructor() {
        super();
        this.quoteResponseRepository = new PrismaQuoteResponseRepository();
    }

    protected async implementation(data: UpdateQuoteResponseDto): Promise<any> {
        const existing = await this.quoteResponseRepository.findById(data.id);
        if (!existing) throw new QuoteResponseNotFoundError(data.id);

        const updated = await this.quoteResponseRepository.update(data.id, data);
        return {
            id: updated.id,
            company_offer_id: updated.company_offer_id,
            unit_price: Number(updated.unit_price),
            quantity: updated.quantity,
            payment_condition_id: updated.payment_condition_id,
            delivery_method_id: updated.delivery_method_id,
            delivery_time: updated.delivery_time,
            notes: updated.notes,
            has_guarantee: updated.has_guarantee,
            status: updated.status,
            rejection_reason: updated.rejection_reason,
            total_amount: Number(updated.total_amount),
            created_at: updated.created_at,
        };
    }
}
