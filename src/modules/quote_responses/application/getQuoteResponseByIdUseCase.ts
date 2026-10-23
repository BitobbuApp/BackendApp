import { UseCase } from "../../../shared/application/useCase";
import { QuoteResponseRepository } from "../domain/repositories/quote_response.repository";
import { PrismaQuoteResponseRepository } from "../infrastructure/persistence/PrismaQuoteResponseRepository";
import { QuoteResponseNotFoundError } from "../domain/errors/quote_response.errors";
import { quoteResponseDtoResponseSchema } from "./dtos/quote_response.dto";
import { assertActorRole } from "./helpers/assertActorRole";
import Joi from "joi";

interface GetQuoteResponseByIdDto {
    id: string;
    requester_company_id: string;
}

export class GetQuoteResponseByIdUseCase extends UseCase<GetQuoteResponseByIdDto, any> {
    protected inputSchema: Joi.Schema = Joi.object({
        id: Joi.string().uuid().required(),
        requester_company_id: Joi.string().uuid().required(),
    });
    protected outputSchema: Joi.Schema = quoteResponseDtoResponseSchema;
    private readonly quoteResponseRepository: QuoteResponseRepository;

    constructor() {
        super();
        this.quoteResponseRepository = new PrismaQuoteResponseRepository();
    }

    protected async implementation({ id, requester_company_id }: GetQuoteResponseByIdDto): Promise<any> {
        const response = await this.quoteResponseRepository.findById(id);
        if (!response) throw new QuoteResponseNotFoundError(id);
        // Only the buyer (request owner) and the supplier of this quote can read it
        await assertActorRole(id, requester_company_id, ['buyer', 'supplier'], 'view');
        return response;
    }
}
