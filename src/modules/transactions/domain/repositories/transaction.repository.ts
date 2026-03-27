import { Transaction } from "../entities/transaction.entity";

export interface PaginatedTransactions {
    items: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface TransactionRepository {
    create(transaction: Partial<Transaction>): Promise<Transaction>;
    findById(id: string): Promise<Transaction | null>;
    findByCompanyId(companyId: string, page: number, limit: number): Promise<PaginatedTransactions>;
    update(id: string, transaction: Partial<Transaction>): Promise<Transaction>;
    delete(id: string): Promise<void>;
}
