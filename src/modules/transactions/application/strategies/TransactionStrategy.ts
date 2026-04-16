import { TransactionNotFoundError } from "../../domain/errors/transaction.errors";
import { Transaction } from '../../domain/entities/transaction.entity';

export type ActorRole = 'buyer' | 'supplier' | 'system';

export interface TransactionActionParams {
    transactionId: string;
    actorCompanyId: string;
    payload?: Record<string, any> | undefined;
}

export interface TransactionStrategy {
    readonly action: string;
    readonly allowedActors: ActorRole[];
    execute(params: TransactionActionParams): Promise<Transaction>;
}
