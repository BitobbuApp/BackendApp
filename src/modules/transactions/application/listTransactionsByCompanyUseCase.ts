import { UseCase } from "../../../shared/application/useCase";
import { TransactionRepository } from "../domain/repositories/transaction.repository";
import { PrismaTransactionRepository } from "../infrastructure/persistence/PrismaTransactionRepository";
import { listTransactionsQuerySchema, transactionListDtoResponseSchema } from "./dtos/transaction.dto";
import Joi from "joi";

interface ListTransactionsInput {
    company_id: string;
    page: number;
    limit: number;
}

export class ListTransactionsByCompanyUseCase extends UseCase<ListTransactionsInput, any> {
    protected inputSchema: Joi.Schema = Joi.object({
        company_id: Joi.string().uuid().required(),
        page: Joi.number().integer().min(1).required(),
        limit: Joi.number().integer().min(1).max(100).required()
    });
    protected outputSchema: Joi.Schema = transactionListDtoResponseSchema;
    private readonly transactionRepository: TransactionRepository;

    constructor() {
        super();
        this.transactionRepository = new PrismaTransactionRepository();
    }

    protected async implementation(data: ListTransactionsInput): Promise<any> {
        return await this.transactionRepository.findByCompanyId(data.company_id, data.page, data.limit);
    }
}
