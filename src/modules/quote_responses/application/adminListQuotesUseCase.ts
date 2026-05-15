import { UseCase } from "../../../shared/application/useCase";
import { QuoteResponseRepository } from "../domain/repositories/quote_response.repository";
import { PrismaQuoteResponseRepository } from "../infrastructure/persistence/PrismaQuoteResponseRepository";
import Joi from "joi";

export class AdminListQuotesUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        status: Joi.string().allow('').optional(),
        request_id: Joi.string().uuid().optional(),
        supplier_id: Joi.string().uuid().optional(),
        serial_number: Joi.number().optional(),
        from_date: Joi.date().optional(),
        to_date: Joi.date().optional()
    });
    protected outputSchema = Joi.any();

    private readonly quoteRepository: QuoteResponseRepository;

    constructor(quoteRepository?: QuoteResponseRepository) {
        super();
        this.quoteRepository = quoteRepository || new PrismaQuoteResponseRepository();
    }

    protected async implementation(input: any): Promise<any> {
        const { page, limit, ...filters } = input;
        const result = await this.quoteRepository.findAllAdmin(filters, page, limit);

        return result;
    }
}
