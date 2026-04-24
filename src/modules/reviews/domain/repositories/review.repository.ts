import { Review } from '../entities/review.entity';

export interface ReviewRepository {
    create(review: Partial<Review>): Promise<Review>;
    findById(id: string): Promise<Review | null>;
    findByTransactionAndAuthor(transactionId: string, authorCompanyId: string): Promise<Review | null>;
    findByTransactionAndRole(transactionId: string, reviewerRole: 'buyer' | 'seller'): Promise<Review | null>;
    update(id: string, data: Partial<Review>): Promise<Review>;
}
