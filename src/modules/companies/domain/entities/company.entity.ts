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
