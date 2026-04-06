import { EstimatedMonthlyTransaction } from "../entities/estimatedMonthlyTransaction.entity";

export interface EstimatedMonthlyTransactionRepository {
    list(): Promise<EstimatedMonthlyTransaction[]>;
}
