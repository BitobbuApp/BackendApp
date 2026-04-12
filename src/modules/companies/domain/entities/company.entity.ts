// src/modules/companies/domain/companyEntity.ts

export class Company {
    constructor(
        public id: string,
        public trade_name: string,
        public legal_name: string | null = null,
        public tax_id: string | null = null,
        public bio: string | null = null,
        public logo_url: string | null = null,
        public sector: string | null = null,
        public company_type: string | null = null,
        public can_buy: boolean = false,
        public can_sell: boolean = false,
        public is_founder_badge: boolean = false,
        public founding_year: number | null = null,
        public monthly_transactions_id: string | null = null,
        public company_size_id: string | null = null,
        public average_rating: number = 0,
        public transaction_count: number = 0,
        public review_count: number = 0,
        public seller_review_count: number = 0,
        public buyer_review_count: number = 0,
        public avg_quality: number = 0,
        public avg_compliance_seller: number = 0,
        public avg_communication_seller: number = 0,
        public avg_price: number = 0,
        public avg_compliance_buyer: number = 0,
        public avg_reliability: number = 0,
        public avg_communication_buyer: number = 0,
        public product_count: number = 0,
        public created_at: Date | null = null,
        public updated_at: Date | null = null,
        // Relations
        public locations?: any[],
        public contacts?: any[],
        public commercial_profile?: any,
        public settings?: any,
        public payment_methods?: any[],
        public categories_of_interest?: any[]
    ) { }
}
