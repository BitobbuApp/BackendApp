import { UseCase } from "../../../shared/application/useCase";
import { TransactionRepository } from "../domain/repositories/transaction.repository";
import { PrismaTransactionRepository } from "../infrastructure/persistence/PrismaTransactionRepository";
import { TransactionNotFoundError } from "../domain/errors/transaction.errors";
import { transactionDtoResponseSchema } from "./dtos/transaction.dto";
import { UnauthorizedTransactionActorError } from "./helpers/assertTransactionActorRole";
import Joi from "joi";

interface GetTransactionByIdDto {
    id: string;
    requester_company_id: string;
}

export class GetTransactionByIdUseCase extends UseCase<GetTransactionByIdDto, any> {
    protected inputSchema: Joi.Schema = Joi.object({
        id: Joi.string().uuid().required(),
        requester_company_id: Joi.string().uuid().required(),
    });
    protected outputSchema: Joi.Schema = transactionDtoResponseSchema;
    private readonly transactionRepository: TransactionRepository;

    constructor() {
        super();
        this.transactionRepository = new PrismaTransactionRepository();
    }

    protected async implementation({ id, requester_company_id }: GetTransactionByIdDto): Promise<any> {
        const transaction = await this.transactionRepository.findById(id);
        if (!transaction) throw new TransactionNotFoundError(id);
        // Only the buyer and the supplier of the transaction can read it
        if (requester_company_id !== transaction.buyer_id && requester_company_id !== transaction.supplier_id) {
            throw new UnauthorizedTransactionActorError('unknown', 'view');
        }
        return transaction;
    }
}
