import { TransactionNotFoundError } from "../../domain/errors/transaction.errors";
import { TransactionStrategy, TransactionActionParams } from './TransactionStrategy';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { assertTransactionActorRole } from '../helpers/assertTransactionActorRole';
import { assertTransition } from '../../domain/transactionStateMachine';
import { PrismaTransactionRepository } from '../../infrastructure/persistence/PrismaTransactionRepository';

/**
 * PaymentUploadedStrategy
 * Buyer uploads payment proof (bank transfer, etc.).
 * Status transitions to `payment_review`.
 */
export class PaymentUploadedStrategy implements TransactionStrategy {
    readonly action = 'payment_uploaded';
    readonly allowedActors = ['buyer' as const];

    private readonly repo = new PrismaTransactionRepository();

    async execute(params: TransactionActionParams): Promise<Transaction> {
        const { transactionId, actorCompanyId, payload } = params;

        await assertTransactionActorRole(transactionId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(transactionId);
        if (!existing) throw new TransactionNotFoundError(transactionId);

        assertTransition(existing.status, TransactionStatus.PaymentReview);

        return this.repo.updateWithRevision(transactionId, {
            status: TransactionStatus.PaymentReview,
            buyer_confirmed: true,
            buyer_confirmed_at: new Date(),
        }, {
            action: this.action,
            actorCompanyId,
            snapshot: payload,
        });
    }
}
