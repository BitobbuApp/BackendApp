export interface SubscriptionRepository {
    findAllAdmin(filters: any, page: number, limit: number): Promise<{ items: any[], total: number }>;
}
