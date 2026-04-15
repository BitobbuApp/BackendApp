import { TransactionStrategy, TransactionActionParams } from './TransactionStrategy';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { assertTransactionActorRole } from '../helpers/assertTransactionActorRole';
import { assertTransition } from '../../domain/transactionStateMachine';
import { prisma } from '../../../../shared/infrastructure/database';
import { RevisionData } from '../../domain/repositories/transaction.repository';

/**
 * TransactionCanceledStrategy
 * Either party cancels the transaction.
 * Status transitions to `canceled`.
 * Also sets conversation.status = 'cancelled'.
 */
export class TransactionCanceledStrategy implements TransactionStrategy {
    readonly action = 'transaction_canceled';
    readonly allowedActors = ['buyer' as const, 'supplier' as const];

    async execute(params: TransactionActionParams): Promise<Transaction> {
        const { transactionId, actorCompanyId, payload } = params;

        await assertTransactionActorRole(transactionId, actorCompanyId, this.allowedActors, this.action);

        const existing = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { conversation: { select: { id: true } }, payment_method: true },
        });
        if (!existing) throw new Error('Transaction not found');

        assertTransition(existing.status, TransactionStatus.Canceled);

        const repo = new (require('../../infrastructure/persistence/PrismaTransactionRepository').PrismaTransactionRepository)();
        return repo.cancelTransaction(transactionId, actorCompanyId, payload?.reason ?? 'Canceled');
    }
}
