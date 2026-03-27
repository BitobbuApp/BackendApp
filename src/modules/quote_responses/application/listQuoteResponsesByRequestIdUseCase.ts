import { UseCase } from "../../../shared/application/useCase";
import { QuoteResponseRepository } from "../domain/repositories/quote_response.repository";
import { PrismaQuoteResponseRepository } from "../infrastructure/persistence/PrismaQuoteResponseRepository";
import Joi from "joi";

interface ListByRequestDto {
    request_id: string;
    page: number;
    limit: number;
}

const inputSchema = Joi.object({
    request_id: Joi.string().uuid().required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
});

export class ListQuoteResponsesByRequestIdUseCase extends UseCase<ListByRequestDto, any> {
    protected inputSchema: Joi.Schema = inputSchema;
    protected outputSchema: Joi.Schema = Joi.any(); // We can validate the output more strictly later if needed
    private readonly quoteResponseRepository: QuoteResponseRepository;

    constructor() {
        super();
        this.quoteResponseRepository = new PrismaQuoteResponseRepository();
    }

    protected async implementation(data: ListByRequestDto): Promise<any> {
        return await this.quoteResponseRepository.findByRequestId(data.request_id, data.page, data.limit);
    }
}
