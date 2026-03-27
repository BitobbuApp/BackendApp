import { UseCase } from "../../../shared/application/useCase";
import { TransactionRepository } from "../domain/repositories/transaction.repository";
import { PrismaTransactionRepository } from "../infrastructure/persistence/PrismaTransactionRepository";
import { TransactionNotFoundError } from "../domain/errors/transaction.errors";
import Joi from "joi";

export class DeleteTransactionUseCase extends UseCase<string, void> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = Joi.any();
    private readonly transactionRepository: TransactionRepository;

    constructor() {
        super();
        this.transactionRepository = new PrismaTransactionRepository();
    }

    protected async implementation(id: string): Promise<void> {
        const transaction = await this.transactionRepository.findById(id);
        if (!transaction) throw new TransactionNotFoundError(id);

        await this.transactionRepository.delete(id);
    }
}
