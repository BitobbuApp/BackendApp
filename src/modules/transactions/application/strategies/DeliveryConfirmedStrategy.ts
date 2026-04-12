import { TransactionStrategy, TransactionActionParams } from './TransactionStrategy';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { assertTransactionActorRole } from '../helpers/assertTransactionActorRole';
import { assertTransition } from '../../domain/transactionStateMachine';
import { PrismaTransactionRepository } from '../../infrastructure/persistence/PrismaTransactionRepository';

/**
 * DeliveryConfirmedStrategy
 * Buyer confirms receipt of goods.
 * Status transitions to `completed`.
 */
export class DeliveryConfirmedStrategy implements TransactionStrategy {
    readonly action = 'delivery_confirmed';
    readonly allowedActors = ['buyer' as const];

    private readonly repo = new PrismaTransactionRepository();

    async execute(params: TransactionActionParams): Promise<Transaction> {
        const { transactionId, actorCompanyId } = params;

        await assertTransactionActorRole(transactionId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(transactionId);
        if (!existing) throw new Error('Transaction not found');

        assertTransition(existing.status, TransactionStatus.Completed);

        return this.repo.updateWithRevision(transactionId, {
            status: TransactionStatus.Completed,
            actual_delivery_date: new Date(),
        }, {
            action: this.action,
            actorCompanyId,
            snapshot: { actual_delivery_date: new Date().toISOString() },
        });
    }
}
