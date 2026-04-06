import { UseCase } from "../../../shared/application/useCase";
import { QuoteResponseRepository } from "../domain/repositories/quote_response.repository";
import { PrismaQuoteResponseRepository } from "../infrastructure/persistence/PrismaQuoteResponseRepository";
import { QuoteResponseNotFoundError } from "../domain/errors/quote_response.errors";
import { receivedQuoteResponseDtoResponseSchema } from "./dtos/quote_response.dto";
import Joi from "joi";

export class GetQuoteResponseWithSupplierUseCase extends UseCase<string, any> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = receivedQuoteResponseDtoResponseSchema;
    private readonly quoteResponseRepository: QuoteResponseRepository;

    constructor() {
        super();
        this.quoteResponseRepository = new PrismaQuoteResponseRepository();
    }

    protected async implementation(id: string): Promise<any> {
        const response = await this.quoteResponseRepository.findQuoteResponseAndSupplier(id);
        if (!response) throw new QuoteResponseNotFoundError(id);
        return response;
    }
}
