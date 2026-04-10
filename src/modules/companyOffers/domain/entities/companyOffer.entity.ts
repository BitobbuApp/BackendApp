// src/modules/companyOffers/domain/entities/companyOffer.entity.ts

export class CompanyOfferPhoto {
    constructor(
        public id: string,
        public offer_id: string,
        public url: string,
        public sort_order: number = 0,
        public created_at: Date | null = null
    ) { }
}

export class CompanyOffer {
    constructor(
        public id: string,
        public company_id: string,
        public name: string,
        public description: string | null = null,
        public category_id: number | null = null,
        public category: string | null = null,
        public supplier_type_id: number | null = null,
        public supplier_type: string | null = null,
        public base_price_usd: number | null = null,
        public unit_id: number | null = null,
        public unit_of_measure: string | null = 'Units',
        public moq: number | null = 1,
        public std_delivery_time: string | null = null,
        public video_url: string | null = null,
        public is_active: boolean = true,
        public rating: number | null = 0.00,
        public created_at: Date | null = null,
        public updated_at: Date | null = null,
        public photos: CompanyOfferPhoto[] = []
    ) { }
}
