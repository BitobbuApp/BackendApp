import { TransactionStrategy, TransactionActionParams } from './TransactionStrategy';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { assertTransactionActorRole } from '../helpers/assertTransactionActorRole';
import { assertTransition } from '../../domain/transactionStateMachine';
import { PrismaTransactionRepository } from '../../infrastructure/persistence/PrismaTransactionRepository';

/**
 * OrderShippedStrategy
 * Supplier marks the order as dispatched/shipped.
 * Status transitions to `in_transit`.
 */
export class OrderShippedStrategy implements TransactionStrategy {
    readonly action = 'order_shipped';
    readonly allowedActors = ['supplier' as const];

    private readonly repo = new PrismaTransactionRepository();

    async execute(params: TransactionActionParams): Promise<Transaction> {
        const { transactionId, actorCompanyId, payload } = params;

        await assertTransactionActorRole(transactionId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(transactionId);
        if (!existing) throw new Error('Transaction not found');

        assertTransition(existing.status, TransactionStatus.InTransit);

        return this.repo.updateWithRevision(transactionId, {
            status: TransactionStatus.InTransit,
            estimated_delivery_date: payload?.estimated_delivery_date ?? null,
        }, {
            action: this.action,
            actorCompanyId,
            snapshot: payload,
        });
    }
}
