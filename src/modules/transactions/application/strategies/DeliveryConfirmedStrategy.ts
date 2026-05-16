import { TransactionNotFoundError } from "../../domain/errors/transaction.errors";
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
        if (!existing) throw new TransactionNotFoundError(transactionId);

        assertTransition(existing.status, TransactionStatus.Completed);

        const now = new Date();
        const expiresAt = new Date(now);
        expiresAt.setDate(expiresAt.getDate() + REVIEW_EXPIRY_DAYS);

        const updated = await prisma.$transaction(async (tx) => {
            // 1. Update transaction to completed
            const updatedTx = await tx.transaction.update({
                where: { id: transactionId },
                data: {
                    status: TransactionStatus.Completed,
                    actual_delivery_date: now,
                    buyer_review_status: 'pending',
                    supplier_review_status: 'pending',
                },
                include: { payment_method: true },
            });

            // 1.5 Increment transaction_count for both companies
            await tx.company.updateMany({
                where: { id: { in: [existing.buyer_id, existing.supplier_id] } },
                data: { transaction_count: { increment: 1 } },
            });

            // 2. Create TransactionRevision snapshot
            await tx.transactionRevision.create({
                data: {
                    transaction_id: transactionId,
                    actor_company_id: actorCompanyId,
                    action: this.action as any,
                    snapshot: {
                        status: existing.status,
                        actual_delivery_date: now.toISOString(),
                    },
                },
            });

            // 3. Create 2 pending Review rows
            // Buyer reviews the Seller
            await tx.review.create({
                data: {
                    transaction_id: transactionId,
                    author_company_id: existing.buyer_id,
                    evaluated_company_id: existing.supplier_id,
                    reviewer_role: 'buyer',
                    review_status: 'pending',
                    expires_at: expiresAt,
                },
            });

            // Seller reviews the Buyer
            await tx.review.create({
                data: {
                    transaction_id: transactionId,
                    author_company_id: existing.supplier_id,
                    evaluated_company_id: existing.buyer_id,
                    reviewer_role: 'seller',
                    review_status: 'pending',
                    expires_at: expiresAt,
                },
            });

            // 4. Update Conversation status to pending_review
            if (existing.conversation?.id) {
                await tx.conversation.update({
                    where: { id: existing.conversation.id },
                    data: { status: 'pending_review' },
                });
            }

            return updatedTx;
        }, {
            maxWait: 300000,
            timeout: 300000,
        });

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
