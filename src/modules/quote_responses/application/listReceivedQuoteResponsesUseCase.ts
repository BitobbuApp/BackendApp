import { UseCase } from "../../../shared/application/useCase";
import { QuoteResponseRepository } from "../domain/repositories/quote_response.repository";
import { PrismaQuoteResponseRepository } from "../infrastructure/persistence/PrismaQuoteResponseRepository";
import { paginatedReceivedQuoteResponsesDtoResponseSchema } from "./dtos/quote_response.dto";
import Joi from "joi";

interface ListReceivedDto {
    company_id: string;
    page: number;
    limit: number;
}

const inputSchema = Joi.object({
    company_id: Joi.string().uuid().required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
});

export class ListReceivedQuoteResponsesUseCase extends UseCase<ListReceivedDto, any> {
    protected inputSchema: Joi.Schema = inputSchema;
    // Use enriched DTO that includes supplier and request relations
    protected outputSchema: Joi.Schema = paginatedReceivedQuoteResponsesDtoResponseSchema;
    private readonly quoteResponseRepository: QuoteResponseRepository;

    constructor() {
        super();
        this.quoteResponseRepository = new PrismaQuoteResponseRepository();
    }

    protected async implementation(data: ListReceivedDto): Promise<any> {
        return await this.quoteResponseRepository.findByRequestOwnerId(data.company_id, data.page, data.limit);
    }
}
