import { UseCase } from "../../../shared/application/useCase";
import { QuoteResponseRepository } from "../domain/repositories/quote_response.repository";
import { PrismaQuoteResponseRepository } from "../infrastructure/persistence/PrismaQuoteResponseRepository";
import { QuoteResponseNotFoundError } from "../domain/errors/quote_response.errors";
import { assertSupplierCanEditQuote } from "./helpers/quoteOwnership";
import Joi from "joi";

interface DeleteQuoteResponseDto {
    id: string;
    requester_company_id: string;
}

export class DeleteQuoteResponseUseCase extends UseCase<DeleteQuoteResponseDto, any> {
    protected inputSchema: Joi.Schema = Joi.object({
        id: Joi.string().uuid().required(),
        requester_company_id: Joi.string().uuid().required(),
    });
    protected outputSchema: Joi.Schema = Joi.object({ success: Joi.boolean() }).options({ stripUnknown: true });
    private readonly quoteResponseRepository: QuoteResponseRepository;

    constructor() {
        super();
        this.quoteResponseRepository = new PrismaQuoteResponseRepository();
    }

    protected async implementation({ id, requester_company_id }: DeleteQuoteResponseDto): Promise<any> {
        const existing = await this.quoteResponseRepository.findById(id);
        if (!existing) throw new QuoteResponseNotFoundError(id);
        assertSupplierCanEditQuote(existing as any, requester_company_id);

        await this.quoteResponseRepository.delete(id);
        return { success: true };
    }
}
