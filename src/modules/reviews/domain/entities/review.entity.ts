export class Review {
    constructor(
        public id: string,
        public transaction_id: string,
        public author_company_id: string,
        public evaluated_company_id: string,
        public reviewer_role: 'buyer' | 'seller',
        public rating: number | null,
        public review_status: string = 'pending',
        public comment: string | null = null,
        public is_public: boolean = true,
        public score_quality: number | null = null,
        public score_compliance: number | null = null,
        public score_communication: number | null = null,
        public score_price: number | null = null,
        public score_reliability: number | null = null,
        public submitted_at: Date | null = null,
        public expires_at: Date | null = null,
        public created_at: Date | null = null,
    ) { }
}
