import { TransactionNotFoundError } from "../../domain/errors/transaction.errors";
import { TransactionStrategy, TransactionActionParams } from './TransactionStrategy';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { assertTransactionActorRole } from '../helpers/assertTransactionActorRole';
import { assertTransition } from '../../domain/transactionStateMachine';
import { PrismaTransactionRepository } from '../../infrastructure/persistence/PrismaTransactionRepository';

/**
 * PaymentApprovedStrategy
 * Supplier validates payment in bank and approves.
 * Status transitions to `preparing_order`.
 */
export class PaymentApprovedStrategy implements TransactionStrategy {
    readonly action = 'payment_approved';
    readonly allowedActors = ['supplier' as const];

    private readonly repo = new PrismaTransactionRepository();

    async execute(params: TransactionActionParams): Promise<Transaction> {
        const { transactionId, actorCompanyId } = params;

        await assertTransactionActorRole(transactionId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(transactionId);
        if (!existing) throw new TransactionNotFoundError(transactionId);

        assertTransition(existing.status, TransactionStatus.PreparingOrder);

        return this.repo.updateWithRevision(transactionId, {
            status: TransactionStatus.PreparingOrder,
            supplier_confirmed: true,
            supplier_confirmed_at: new Date(),
        }, {
            action: this.action,
            actorCompanyId,
            snapshot: params.payload, // If any extra details exist
        });
    }
}
