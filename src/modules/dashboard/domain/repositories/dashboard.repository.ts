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

export interface AdminDashboardKpis {
    total_users: number;
    active_users: number;
    pending_verifications: number;
    total_companies: number;
    rfqs_last_30_days: number;
    quotes_last_30_days: number;
    total_gmv_usd: number;
}

export interface DashboardRepository {
    getStats(companyId: string): Promise<DashboardStats>;
    getAdminKpis(): Promise<AdminDashboardKpis>;
}
