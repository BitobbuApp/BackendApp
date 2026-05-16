import { TransactionNotFoundError } from "../../domain/errors/transaction.errors";
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
        if (!existing) throw new TransactionNotFoundError(transactionId);

        assertTransition(existing.status, TransactionStatus.Canceled);

        const updated = await prisma.$transaction(async (tx) => {
            // 1. Update transaction status
            const updatedTx = await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    status: TransactionStatus.Canceled,
                    cancellation_reason: payload?.reason ?? 'Canceled',
                },
                include: { payment_method: true },
            });

            // 2. Create revision
            await tx.transactionRevision.create({
                data: {
                    transaction_id: transactionId,
                    actor_company_id: actorCompanyId,
                    action: 'transaction_canceled' as any,
                    snapshot: {
                        status: existing.status,
                        cancellation_reason: payload?.reason ?? 'Canceled',
                    },
                },
            });

            // 3. Mark conversation as cancelled
            if (existing.conversation?.id) {
                await tx.conversation.update({
                    where: { id: existing.conversation.id },
                    data: { status: 'cancelled' },
                });
            }

            return updatedTx;
        }, { maxWait: 300000, timeout: 300000 });

        return new Transaction(
            updated.id,
            updated.quote_response_id,
            updated.buyer_id,
            updated.supplier_id,
            updated.product_description,
            Number(updated.unit_price_usd),
            Number(updated.quantity),
            Number(updated.total_amount_usd),
            updated.payment_method_id,
            updated.payment_method?.name_es ?? null,
            updated.payment_conditions,
            updated.payment_condition_id ?? null,
            updated.delivery_time,
            updated.status,
            updated.estimated_delivery_date,
            updated.actual_delivery_date,
            updated.cancellation_reason,
            updated.buyer_confirmed,
            updated.supplier_confirmed,
            updated.buyer_confirmed_at,
            updated.supplier_confirmed_at,
            updated.exchange_rate_id ?? null,
            updated.payment_currency ?? 'USD',
            updated.buyer_review_status ?? 'pending',
            updated.supplier_review_status ?? 'pending',
            null, // buyer_name
            null, // supplier_name
            (updated as any).serial_number,
            updated.created_at,
            updated.updated_at,
        );
    }
}
