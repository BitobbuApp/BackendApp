import { TransactionNotFoundError } from "../../domain/errors/transaction.errors";
import { TransactionStrategy, TransactionActionParams } from './TransactionStrategy';
import { Transaction, TransactionStatus } from '../../domain/entities/transaction.entity';
import { assertTransactionActorRole } from '../helpers/assertTransactionActorRole';
import { assertTransition } from '../../domain/transactionStateMachine';
import { PrismaTransactionRepository } from '../../infrastructure/persistence/PrismaTransactionRepository';

/**
 * DisputeRaisedStrategy
 * Either party raises a dispute.
 * Status transitions to `in_dispute`.
 */
export class DisputeRaisedStrategy implements TransactionStrategy {
    readonly action = 'dispute_raised';
    readonly allowedActors = ['buyer' as const, 'supplier' as const];

    private readonly repo = new PrismaTransactionRepository();

    async execute(params: TransactionActionParams): Promise<Transaction> {
        const { transactionId, actorCompanyId, payload } = params;

        await assertTransactionActorRole(transactionId, actorCompanyId, this.allowedActors, this.action);

        const existing = await this.repo.findById(transactionId);
        if (!existing) throw new TransactionNotFoundError(transactionId);

        assertTransition(existing.status, TransactionStatus.InDispute);

        return this.repo.updateWithRevision(transactionId, {
            status: TransactionStatus.InDispute,
        }, {
            action: this.action,
            actorCompanyId,
            snapshot: payload,
        });
    }
}
