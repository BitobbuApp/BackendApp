import { ReviewRepository } from '../../domain/repositories/review.repository';
import { Review } from '../../domain/entities/review.entity';
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaReviewRepository implements ReviewRepository {
    async create(review: Partial<Review>): Promise<Review> {
        const created = await prisma.review.create({
            data: {
                transaction_id: review.transaction_id!,
                author_company_id: review.author_company_id!,
                evaluated_company_id: review.evaluated_company_id!,
                reviewer_role: review.reviewer_role!,
                rating: review.rating ?? null,
                review_status: review.review_status ?? 'pending',
                comment: review.comment ?? null,
                is_public: review.is_public ?? true,
                score_quality: review.score_quality ?? null,
                score_compliance: review.score_compliance ?? null,
                score_communication: review.score_communication ?? null,
                score_price: review.score_price ?? null,
                score_reliability: review.score_reliability ?? null,
                submitted_at: review.submitted_at ?? null,
                expires_at: review.expires_at ?? null,
            } as any,
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<Review | null> {
        const found = await prisma.review.findUnique({ where: { id } });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByTransactionAndAuthor(transactionId: string, authorCompanyId: string): Promise<Review | null> {
        const found = await prisma.review.findFirst({
            where: { transaction_id: transactionId, author_company_id: authorCompanyId },
        });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByTransactionAndRole(transactionId: string, reviewerRole: 'buyer' | 'seller'): Promise<Review | null> {
        const found = await prisma.review.findFirst({
            where: { transaction_id: transactionId, reviewer_role: reviewerRole },
        });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async submitReviewAndUpdateAverages(
        reviewId: string,
        transactionId: string,
        reviewerRole: 'buyer' | 'seller',
        reviewData: any,
        companyUpdateData: any,
        supplierId: string,
        now: Date
    ): Promise<{ submittedReview: Review, bothSubmitted: boolean }> {
        return prisma.$transaction(async (tx) => {
            const submittedReview = await tx.review.update({
                where: { id: reviewId },
                data: reviewData,
            });

            if (reviewerRole === 'buyer') {
                await tx.transaction.update({
                    where: { id: transactionId },
                    data: { buyer_review_status: 'submitted' as any },
                });
            } else {
                await tx.transaction.update({
                    where: { id: transactionId },
                    data: { supplier_review_status: 'submitted' as any },
                });
            }

            await tx.company.update({
                where: { id: supplierId },
                data: companyUpdateData,
            });

            const counterpartRole = reviewerRole === 'buyer' ? 'seller' : 'buyer';
            const counterpart = await tx.review.findFirst({
                where: { transaction_id: transactionId, reviewer_role: counterpartRole },
            });
            const bothSubmitted = counterpart?.review_status === 'submitted';

            const transaction = await tx.transaction.findUnique({
                where: { id: transactionId },
                include: { conversation: { select: { id: true } } },
            });

            if (bothSubmitted && transaction?.conversation?.id) {
                await tx.conversation.update({
                    where: { id: transaction.conversation.id },
                    data: { status: 'completed' as any },
                });
            }

            return { submittedReview: this.mapToEntity(submittedReview), bothSubmitted };
        }, { maxWait: 30000, timeout: 30000 });
    }

    async update(id: string, data: Partial<Review>): Promise<Review> {
        const updated = await prisma.review.update({
            where: { id },
            data: {
                ...(data.rating !== undefined && { rating: data.rating }),
                ...(data.review_status !== undefined && { review_status: data.review_status }),
                ...(data.comment !== undefined && { comment: data.comment }),
                ...(data.is_public !== undefined && { is_public: data.is_public }),
                ...(data.score_quality !== undefined && { score_quality: data.score_quality }),
                ...(data.score_compliance !== undefined && { score_compliance: data.score_compliance }),
                ...(data.score_communication !== undefined && { score_communication: data.score_communication }),
                ...(data.score_price !== undefined && { score_price: data.score_price }),
                ...(data.score_reliability !== undefined && { score_reliability: data.score_reliability }),
                ...(data.submitted_at !== undefined && { submitted_at: data.submitted_at }),
            } as any,
        });
        return this.mapToEntity(updated);
    }

    private mapToEntity(db: any): Review {
        return new Review(
            db.id,
            db.transaction_id,
            db.author_company_id,
            db.evaluated_company_id,
            db.reviewer_role,
            db.rating != null ? Number(db.rating) : null,
            db.review_status,
            db.comment,
            db.is_public,
            db.score_quality,
            db.score_compliance,
            db.score_communication,
            db.score_price,
            db.score_reliability,
            db.submitted_at,
            db.expires_at,
            db.created_at,
        );
    }
}
