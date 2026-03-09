import { UseCase } from "../../../shared/application/useCase";
import { QuoteResponseRepository } from "../domain/repositories/quote_response.repository";
import { PrismaQuoteResponseRepository } from "../infrastructure/persistence/PrismaQuoteResponseRepository";
import { listQuoteResponsesDtoRequestSchema, paginatedQuoteResponsesDtoResponseSchema } from "./dtos/quote_response.dto";
import Joi from "joi";

interface ListQuoteResponsesDto {
    supplier_id: string;
    page: number;
    limit: number;
}

export class ListQuoteResponsesByCompanyUseCase extends UseCase<ListQuoteResponsesDto, any> {
    protected inputSchema: Joi.Schema = listQuoteResponsesDtoRequestSchema;
    protected outputSchema: Joi.Schema = paginatedQuoteResponsesDtoResponseSchema;
    private readonly quoteResponseRepository: QuoteResponseRepository;

    constructor() {
        super();
        this.quoteResponseRepository = new PrismaQuoteResponseRepository();
    }

    protected async implementation(data: ListQuoteResponsesDto): Promise<any> {
        return await this.quoteResponseRepository.findBySupplierId(data.supplier_id, data.page, data.limit);
    }
}
