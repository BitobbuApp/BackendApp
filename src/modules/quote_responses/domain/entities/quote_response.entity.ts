export enum ResponseStatus {
    Pending = 'pending',
    Negotiating = 'negotiating',
    FormalRequestPending = 'formal_request_pending',
    FormalApprovalPending = 'formal_approval_pending',
    Accepted = 'accepted',
    Rejected = 'rejected',
    Expired = 'expired',
}

export class QuoteResponse {
    constructor(
        public id: string,
        public request_id: string,
        public supplier_id: string,
        public company_offer_id: string | null = null,
        public unit_price_usd: number,
        public quantity: number,
        public payment_conditions: string | null = null,
        public payment_condition_id: string | null = null,
        public delivery_method_id: string | null = null,
        public delivery_time: string | null = null,
        public notes: string | null = null,
        public has_guarantee: boolean = false,
        public status: ResponseStatus | string = 'pending',
        public rejection_reason: string | null = null,
        public total_amount_usd: number = 0,
        public exchange_rate_id: string | null = null,
        public payment_currency: string = 'USD',
        public formal_quote_url: string | null = null,
        public created_at: Date | null = null,
        public updated_at: Date | null = null
    ) { }
}
