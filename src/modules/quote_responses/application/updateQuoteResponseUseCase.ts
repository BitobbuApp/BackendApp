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
    payment_conditions?: string | null;
    delivery_time?: string | null;
    notes?: string | null;
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
        return updated;
    }
}
