import { UseCase } from "../../../shared/application/useCase";
import { TransactionRepository } from "../domain/repositories/transaction.repository";
import { PrismaTransactionRepository } from "../infrastructure/persistence/PrismaTransactionRepository";
import { TransactionNotFoundError } from "../domain/errors/transaction.errors";
import { transactionDtoResponseSchema } from "./dtos/transaction.dto";
import Joi from "joi";

export class GetTransactionByIdUseCase extends UseCase<string, any> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = transactionDtoResponseSchema;
    private readonly transactionRepository: TransactionRepository;

    constructor() {
        super();
        this.transactionRepository = new PrismaTransactionRepository();
    }

    protected async implementation(id: string): Promise<any> {
        const transaction = await this.transactionRepository.findById(id);
        if (!transaction) throw new TransactionNotFoundError(id);
        return transaction;
    }
}
