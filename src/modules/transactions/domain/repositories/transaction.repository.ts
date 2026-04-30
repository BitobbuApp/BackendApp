import { Transaction } from "../entities/transaction.entity";

export interface PaginatedTransactions {
    items: Transaction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface RevisionData {
    action: string;
    actorCompanyId: string;
    snapshot?: Record<string, any> | undefined;
}

export interface TransactionRepository {
    create(transaction: Partial<Transaction>): Promise<Transaction>;
    findById(id: string): Promise<Transaction | null>;
    findByCompanyId(companyId: string, page: number, limit: number): Promise<PaginatedTransactions>;
    update(id: string, transaction: Partial<Transaction>): Promise<Transaction>;
    updateWithRevision(id: string, transaction: Partial<Transaction>, revision: RevisionData): Promise<Transaction>;
    delete(id: string): Promise<void>;
    findAllAdmin(filters: any, page: number, limit: number): Promise<PaginatedTransactions>;
}
