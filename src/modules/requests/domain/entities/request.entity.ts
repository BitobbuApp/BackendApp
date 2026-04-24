export interface RequestFileEntity {
    id: string;
    request_id: string;
    url: string;
    file_name: string | null;
    created_at: Date | null;
}

export interface RequestCompanyEntity {
    id: string;
    trade_name: string;
    logo_url: string | null;
    average_rating: number | null;
    bio: string | null;
    sector: string | null;
    company_type: string | null;
    review_count: number;
    transaction_count: number;
    // As SELLER
    avg_quality: number;
    avg_compliance_seller: number;
    avg_communication_seller: number;
    avg_price: number;
    seller_review_count: number;
    // As BUYER
    avg_compliance_buyer: number;
    avg_reliability: number;
    avg_communication_buyer: number;
    buyer_review_count: number;
    locations: any[];
}

export class RequestEntity {
    constructor(
        public id: string,
        public company_id: string,
        public product_service: string,
        public quantity: number,
        public user_id: string | null = null,
        public unit_id: number = 1,
        public unit_of_measure: string = 'Units',
        public description: string | null = null,
        public category_id: number | null = null,
        public category: string | null = null,
        public status: string = 'active',
        public type: string = 'product',
        public expiration_date: Date | null = null,
        public response_count: number = 0,
        public payment_condition_id: string | null = null,
        public country_id: number | null = null,
        public state_id: number | null = null,
        public city_id: number | null = null,
        public reach_service: string | null = null,
        public company: RequestCompanyEntity | null = null,
        public files: RequestFileEntity[] = [],
        public created_at: Date | null = null,
        public updated_at: Date | null = null
    ) { }
}
