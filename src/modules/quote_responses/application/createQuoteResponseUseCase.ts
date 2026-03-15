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
    unit_price: number;
    quantity: number;
    payment_conditions?: string | null;
    delivery_time?: string | null;
    notes?: string | null;
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
        try {
            const created = await this.quoteResponseRepository.create(data);
            return created;
        } catch (error: any) {
            if (error.message === 'DuplicateQuoteResponseError') {
                throw new DuplicateQuoteResponseError(data.request_id, data.supplier_id);
            }
            throw error;
        }
    }
}
