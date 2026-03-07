// src/modules/companies/domain/companyEntity.ts

export type CompanyInterest = 'Buy' | 'Sell' | 'Both';
export type CompanyVolume = 'Small' | 'Medium' | 'Large';
export type CompanyType = 'Manufacturer' | 'Wholesaler' | 'Distributor' | 'Service_Provider' | 'Retailer';
export type CategoryType = 'Food' | 'Hardware' | 'Health' | 'IT' | 'Automotive' | 'Packaging' | 'Chemicals' | 'Office' | 'Textile' | 'Logistics' | 'Maintenance' | 'Security' | 'Marketing' | 'Legal' | 'HR';

export class Company {
    constructor(
        public id: string,
        public trade_name: string,
        public legal_name: string | null = null,
        public tax_id: string | null = null,
        public founding_year: number | null = null,
        public bio: string | null = null,
        public logo_url: string | null = null,
        public sector: CategoryType | null = null,
        public company_type: CompanyType | null = null,
        public interest: CompanyInterest = 'Both',
        public approximate_volume: CompanyVolume | null = 'Medium',
        public average_rating: number = 0,
        public transaction_count: number = 0,
        public review_count: number = 0,
        public created_at: Date | null = null,
        public updated_at: Date | null = null
    ) { }
}
