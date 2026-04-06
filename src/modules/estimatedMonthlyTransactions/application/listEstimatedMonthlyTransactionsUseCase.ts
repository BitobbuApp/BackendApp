import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { listEstimatedMonthlyTransactionsDtoResponseSchema } from "./dtos/estimatedMonthlyTransaction.dto";
import { EstimatedMonthlyTransactionRepository } from "../domain/repositories/estimatedMonthlyTransaction.repository";
import { PrismaEstimatedMonthlyTransactionRepository } from "../infrastructure/persistence/PrismaEstimatedMonthlyTransactionRepository";

export class ListEstimatedMonthlyTransactionsUseCase extends UseCase<Record<string, never>, any> {
    protected inputSchema: Joi.Schema = Joi.object({});
    protected outputSchema: Joi.Schema = listEstimatedMonthlyTransactionsDtoResponseSchema;
    private readonly repository: EstimatedMonthlyTransactionRepository;

    constructor() {
        super();
        this.repository = new PrismaEstimatedMonthlyTransactionRepository();
    }

    protected async implementation(): Promise<any> {
        return await this.repository.list();
    }
}
