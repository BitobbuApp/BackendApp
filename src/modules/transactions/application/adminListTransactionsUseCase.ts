import { UseCase } from "../../../shared/application/useCase";
import { TransactionRepository } from "../domain/repositories/transaction.repository";
import { PrismaTransactionRepository } from "../infrastructure/persistence/PrismaTransactionRepository";
import Joi from "joi";

export class AdminListTransactionsUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        status: Joi.string().allow('').optional(),
        buyer_id: Joi.string().uuid().optional(),
        supplier_id: Joi.string().uuid().optional(),
        search: Joi.string().allow('').optional()
    });
    protected outputSchema = Joi.any();

    private readonly transactionRepository: TransactionRepository;

    constructor(transactionRepository?: TransactionRepository) {
        super();
        this.transactionRepository = transactionRepository || new PrismaTransactionRepository();
    }

    protected async implementation(input: any): Promise<any> {
        const { page, limit, ...filters } = input;
        const result = await this.transactionRepository.findAllAdmin(filters, page, limit);

        return result;
    }
}
