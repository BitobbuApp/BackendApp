import { TransactionStrategy, TransactionActionParams } from './TransactionStrategy';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { assertTransactionActorRole } from '../helpers/assertTransactionActorRole';
import { assertTransition } from '../../domain/transactionStateMachine';
import { prisma } from '../../../../shared/infrastructure/database';
import { RevisionData } from '../../domain/repositories/transaction.repository';

const REVIEW_EXPIRY_DAYS = 14;

/**
 * DeliveryConfirmedStrategy
 * Buyer confirms receipt of goods.
 * Status transitions to `completed`.
 *
 * Atomically:
 * 1. Updates Transaction → status = completed, actual_delivery_date = now()
 * 2. Creates a TransactionRevision snapshot
 * 3. Creates 2 pending Review rows (one per party) with a 14-day expiry
 * 4. Updates Transaction → buyer_review_status = 'pending', supplier_review_status = 'pending'
 * 5. Updates Conversation → status = 'pending_review'
 */
export class DeliveryConfirmedStrategy implements TransactionStrategy {
    readonly action = 'delivery_confirmed';
    readonly allowedActors = ['buyer' as const];

    async execute(params: TransactionActionParams): Promise<Transaction> {
        const { transactionId, actorCompanyId } = params;

        await assertTransactionActorRole(transactionId, actorCompanyId, this.allowedActors, this.action);

        const existing = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { conversation: { select: { id: true } } },
        });
        if (!existing) throw new Error('Transaction not found');

        assertTransition(existing.status, TransactionStatus.Completed);

        const repo = new (require('../../infrastructure/persistence/PrismaTransactionRepository').PrismaTransactionRepository)();
        return repo.confirmDelivery(transactionId, actorCompanyId, new Date());
    }
}
