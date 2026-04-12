import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { ApplicationError } from '../../../shared/domain/error';
import { prisma } from '../../../shared/infrastructure/database';
import { PrismaReviewRepository } from '../infrastructure/persistence/PrismaReviewRepository';
import { computeNewAvg, computeRatingFromDimensions } from './helpers/computeAvg';
import { getIO } from '../../../shared/infrastructure/socket';
import logger from '../../../shared/infrastructure/logger';

interface SubmitBuyerReviewDto {
    transactionId: string;
    actorCompanyId: string;
    score_quality: number;
    score_compliance: number;
    score_communication: number;
    score_price: number;
    comment?: string;
    is_public?: boolean;
}

const score = () => Joi.number().integer().min(1).max(5).required();

const inputSchema = Joi.object({
    transactionId: Joi.string().uuid().required(),
    actorCompanyId: Joi.string().uuid().required(),
    score_quality: score(),
    score_compliance: score(),
    score_communication: score(),
    score_price: score(),
    comment: Joi.string().max(1000).optional(),
    is_public: Joi.boolean().optional().default(true),
}).options({ stripUnknown: true });

const outputSchema = Joi.object().unknown(true);

/**
 * SubmitBuyerReviewUseCase
 *
 * Used by the BUYER to evaluate the SUPPLIER.
 */
export class SubmitBuyerReviewUseCase extends UseCase<SubmitBuyerReviewDto, any> {
    protected inputSchema = inputSchema;
    protected outputSchema = outputSchema;

    private readonly repo = new PrismaReviewRepository();

    protected async implementation(data: SubmitBuyerReviewDto): Promise<any> {
        const { transactionId, actorCompanyId } = data;

        // 1. Load transaction and verify actor is the BUYER
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { conversation: { select: { id: true } } },
        });
        if (!transaction) throw new ApplicationError(404, 'Transaction not found');
        if (transaction.buyer_id !== actorCompanyId) {
            throw new ApplicationError(403, 'You are not the buyer in this transaction');
        }

        // 2. Find pending review
        const existingReview = await this.repo.findByTransactionAndRole(transactionId, 'buyer');
        if (!existingReview) throw new ApplicationError(404, 'Pending review not found');
        if (existingReview.review_status === 'submitted') {
            throw new ApplicationError(400, 'You have already submitted your review');
        }
        if (existingReview.review_status === 'expired') {
            throw new ApplicationError(400, 'The review period has expired');
        }

        // 3. Auto-compute rating for seller
        const rating = computeRatingFromDimensions('buyer', {
            score_quality: data.score_quality,
            score_compliance: data.score_compliance,
            score_communication: data.score_communication,
            score_price: data.score_price,
        });

        const now = new Date();

        // 4. Atomic operation
        const result = await prisma.$transaction(async (tx) => {
            // Update the Review row
            const submittedReview = await tx.review.update({
                where: { id: existingReview.id },
                data: {
                    rating,
                    review_status: 'submitted',
                    submitted_at: now,
                    comment: data.comment ?? null,
                    is_public: data.is_public ?? true,
                    score_quality: data.score_quality,
                    score_compliance: data.score_compliance,
                    score_communication: data.score_communication,
                    score_price: data.score_price,
                } as any,
            });

            // Update Transaction review status
            await tx.transaction.update({
                where: { id: transactionId },
                data: { buyer_review_status: 'submitted' as any },
            });

            // Recompute SUPPLIER averages
            const supplierId = existingReview.evaluated_company_id;
            const supplier = await tx.company.findUniqueOrThrow({ where: { id: supplierId } });

            const cnt = supplier.seller_review_count;
            await tx.company.update({
                where: { id: supplierId },
                data: {
                    review_count: { increment: 1 },
                    seller_review_count: { increment: 1 },
                    average_rating: computeNewAvg(Number(supplier.average_rating ?? 0), supplier.review_count, rating),
                    avg_quality: computeNewAvg(Number(supplier.avg_quality), cnt, data.score_quality),
                    avg_compliance_seller: computeNewAvg(Number(supplier.avg_compliance_seller), cnt, data.score_compliance),
                    avg_communication_seller: computeNewAvg(Number(supplier.avg_communication_seller), cnt, data.score_communication),
                    avg_price: computeNewAvg(Number(supplier.avg_price), cnt, data.score_price),
                },
            });

            // Check if BOTH are submitted
            const counterpart = await tx.review.findFirst({
                where: { transaction_id: transactionId, reviewer_role: 'seller' },
            });
            const bothSubmitted = counterpart?.review_status === 'submitted';

            if (bothSubmitted && transaction.conversation?.id) {
                await tx.conversation.update({
                    where: { id: transaction.conversation.id },
                    data: { status: 'completed' as any },
                });
            }

            return { submittedReview, bothSubmitted };
        }, { maxWait: 30000, timeout: 30000 });

        // 5. Emit socket event
        try {
            if (transaction.conversation?.id) {
                const io = getIO();
                io.to(transaction.conversation.id).emit('review:submitted', {
                    transaction_id: transactionId,
                    reviewer_role: 'buyer',
                    actor_company_id: actorCompanyId,
                    both_submitted: result.bothSubmitted,
                    timestamp: now.toISOString(),
                });
            }
        } catch (err) {
            logger.warn({ err }, 'Failed to emit review:submitted socket event');
        }

        return {
            id: result.submittedReview.id,
            transaction_id: transactionId,
            reviewer_role: 'buyer',
            rating,
            review_status: 'submitted',
            submitted_at: now,
            both_reviews_submitted: result.bothSubmitted,
        };
    }
}
