import { UseCase } from "../../../shared/application/useCase";
import { QuoteResponseRepository } from "../domain/repositories/quote_response.repository";
import { PrismaQuoteResponseRepository } from "../infrastructure/persistence/PrismaQuoteResponseRepository";
import { QuoteResponseNotFoundError } from "../domain/errors/quote_response.errors";
import Joi from "joi";

export class DeleteQuoteResponseUseCase extends UseCase<string, any> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = Joi.object({ success: Joi.boolean() }).options({ stripUnknown: true });
    private readonly quoteResponseRepository: QuoteResponseRepository;

    constructor() {
        super();
        this.quoteResponseRepository = new PrismaQuoteResponseRepository();
    }

    protected async implementation(id: string): Promise<any> {
        const existing = await this.quoteResponseRepository.findById(id);
        if (!existing) throw new QuoteResponseNotFoundError(id);

        await this.quoteResponseRepository.delete(id);
        return { success: true };
    }
}
