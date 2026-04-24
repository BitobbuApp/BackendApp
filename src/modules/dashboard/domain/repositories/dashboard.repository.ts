export interface DashboardStats {
    buyer_stats: {
        generated_requests: number;
        received_quotes: number;
        generated_purchases: number;
        estimated_savings: number;
    };
    supplier_stats: {
        received_requests: number;
        created_quotes: number;
        generated_sales: number;
        generated_revenue: number;
    };
}

export interface DashboardRepository {
    getStats(companyId: string): Promise<DashboardStats>;
}
