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
