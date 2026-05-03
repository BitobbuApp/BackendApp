export interface SubscriptionRepository {
    findAllAdmin(filters: any, page: number, limit: number): Promise<{ items: any[], total: number }>;
    findById(id: string): Promise<any | null>;
    update(id: string, data: any): Promise<any>;
    findActiveByCompanyId(companyId: string): Promise<any | null>;
    deactivateActive(companyId: string): Promise<void>;
    create(data: any): Promise<any>;
}
