import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { ApplicationError } from '../../../shared/domain/error';
import { prisma } from '../../../shared/infrastructure/database';
import { PrismaReviewRepository } from '../infrastructure/persistence/PrismaReviewRepository';
import { computeNewAvg, computeRatingFromDimensions } from './helpers/computeAvg';
import { getIO } from '../../../shared/infrastructure/socket';
import logger from '../../../shared/infrastructure/logger';

interface SubmitSellerReviewDto {
    transactionId: string;
    actorCompanyId: string;
    score_compliance: number;
    score_communication: number;
    score_reliability: number;
    comment?: string;
    is_public?: boolean;
}

const score = () => Joi.number().integer().min(1).max(5).required();

const inputSchema = Joi.object({
    transactionId: Joi.string().uuid().required(),
    actorCompanyId: Joi.string().uuid().required(),
    score_compliance: score(),
    score_communication: score(),
    score_reliability: score(),
    comment: Joi.string().max(1000).optional(),
    is_public: Joi.boolean().optional().default(true),
}).options({ stripUnknown: true });

const outputSchema = Joi.object().unknown(true);

/**
 * SubmitSellerReviewUseCase
 *
 * Used by the SUPPLIER to evaluate the BUYER.
 */
export class SubmitSellerReviewUseCase extends UseCase<SubmitSellerReviewDto, any> {
    protected inputSchema = inputSchema;
    protected outputSchema = outputSchema;

    private readonly repo = new PrismaReviewRepository();

    protected async implementation(data: SubmitSellerReviewDto): Promise<any> {
        const { transactionId, actorCompanyId } = data;

        // 1. Load transaction and verify actor is the SUPPLIER
        const transaction = await prisma.transaction.findUnique({
            where: { id: transactionId },
            include: { conversation: { select: { id: true } } },
        });
        if (!transaction) throw new ApplicationError(404, 'Transaction not found');
        if (transaction.supplier_id !== actorCompanyId) {
            throw new ApplicationError(403, 'You are not the supplier in this transaction');
        }

        // 2. Find pending review
        const existingReview = await this.repo.findByTransactionAndRole(transactionId, 'seller');
        if (!existingReview) throw new ApplicationError(404, 'Pending review not found');
        if (existingReview.review_status === 'submitted') {
            throw new ApplicationError(400, 'You have already submitted your review');
        }
        if (existingReview.review_status === 'expired') {
            throw new ApplicationError(400, 'The review period has expired');
        }

        // 3. Auto-compute rating for buyer
        const rating = computeRatingFromDimensions('seller', {
            score_compliance: data.score_compliance,
            score_communication: data.score_communication,
            score_reliability: data.score_reliability,
        });

        const now = new Date();

        // 4. Atomic operation via repository
        const reviewData = {
            rating,
            review_status: 'submitted',
            submitted_at: now,
            comment: data.comment ?? null,
            is_public: data.is_public ?? true,
            score_compliance: data.score_compliance,
            score_communication: data.score_communication,
            score_reliability: data.score_reliability,
        };

        const buyerId = existingReview.evaluated_company_id;
        const buyer = await prisma.company.findUniqueOrThrow({ where: { id: buyerId } });
        const cnt = buyer.buyer_review_count;

        const companyUpdateData = {
            review_count: { increment: 1 },
            buyer_review_count: { increment: 1 },
            average_rating: computeNewAvg(Number(buyer.average_rating ?? 0), buyer.review_count, rating),
            avg_compliance_buyer: computeNewAvg(Number(buyer.avg_compliance_buyer), cnt, data.score_compliance),
            avg_reliability: computeNewAvg(Number(buyer.avg_reliability), cnt, data.score_reliability),
            avg_communication_buyer: computeNewAvg(Number(buyer.avg_communication_buyer), cnt, data.score_communication),
        };

        const result = await this.repo.submitReviewAndUpdateAverages(
            existingReview.id,
            transactionId,
            'seller',
            reviewData,
            companyUpdateData,
            buyerId,
            now
        );

        // 5. Emit socket event
        try {
            if (transaction.conversation?.id) {
                const io = getIO();
                io.to(transaction.conversation.id).emit('review:submitted', {
                    transaction_id: transactionId,
                    reviewer_role: 'seller',
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
            reviewer_role: 'seller',
            rating,
            review_status: 'submitted',
            submitted_at: now,
            both_reviews_submitted: result.bothSubmitted,
        };
    }
}
