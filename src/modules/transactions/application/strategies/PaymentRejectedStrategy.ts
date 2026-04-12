import { TransactionStrategy, TransactionActionParams } from './TransactionStrategy';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { assertTransactionActorRole } from '../helpers/assertTransactionActorRole';
import { assertTransition } from '../../domain/transactionStateMachine';
import { PrismaTransactionRepository } from '../../infrastructure/persistence/PrismaTransactionRepository';

/**
 * PaymentRejectedStrategy
 * Supplier rejects payment proof (wrong amount, bad quality, etc.).
 * Status transitions back to `awaiting_payment`.
 */
export class PaymentRejectedStrategy implements TransactionStrategy {
    readonly action = 'payment_rejected';
    readonly allowedActors = ['supplier' as const];

    private readonly repo = new PrismaTransactionRepository();

    async execute(params: TransactionActionParams): Promise<Transaction> {
        const { transactionId, actorCompanyId, payload } = params;

        await assertTransactionActorRole(transactionId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(transactionId);
        if (!existing) throw new Error('Transaction not found');

        assertTransition(existing.status, TransactionStatus.AwaitingPayment);

        return this.repo.updateWithRevision(transactionId, {
            status: TransactionStatus.AwaitingPayment,
            buyer_confirmed: false,
            buyer_confirmed_at: null,
        }, {
            action: this.action,
            actorCompanyId,
            snapshot: payload,
        });
    }
}
