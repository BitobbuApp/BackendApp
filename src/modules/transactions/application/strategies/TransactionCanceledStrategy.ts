import { TransactionStrategy, TransactionActionParams } from './TransactionStrategy';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { assertTransactionActorRole } from '../helpers/assertTransactionActorRole';
import { assertTransition } from '../../domain/transactionStateMachine';
import { PrismaTransactionRepository } from '../../infrastructure/persistence/PrismaTransactionRepository';

/**
 * TransactionCanceledStrategy
 * Either party cancels the transaction.
 * Status transitions to `canceled`.
 */
export class TransactionCanceledStrategy implements TransactionStrategy {
    readonly action = 'transaction_canceled';
    readonly allowedActors = ['buyer' as const, 'supplier' as const];

    private readonly repo = new PrismaTransactionRepository();

    async execute(params: TransactionActionParams): Promise<Transaction> {
        const { transactionId, actorCompanyId, payload } = params;

        await assertTransactionActorRole(transactionId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(transactionId);
        if (!existing) throw new Error('Transaction not found');

        assertTransition(existing.status, TransactionStatus.Canceled);

        return this.repo.updateWithRevision(transactionId, {
            status: TransactionStatus.Canceled,
            cancellation_reason: payload?.reason ?? 'Canceled',
        }, {
            action: this.action,
            actorCompanyId,
            snapshot: payload,
        });
    }
}
