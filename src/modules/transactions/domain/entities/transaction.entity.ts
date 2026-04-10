export class Transaction {
    constructor(
        public id: string,
        public quote_response_id: string,
        public buyer_id: string,
        public supplier_id: string,
        public product_description: string,
        public unit_price_usd: number,
        public quantity: number,
        public total_amount_usd: number,
        public payment_method_id: number | null = null,
        public payment_method: string | null = null,
        public payment_conditions: string | null = null,
        public payment_condition_id: string | null = null,
        public delivery_time: string | null = null,
        public status: string = 'in_process',
        public estimated_delivery_date: Date | null = null,
        public actual_delivery_date: Date | null = null,
        public cancellation_reason: string | null = null,
        public buyer_confirmed: boolean = false,
        public supplier_confirmed: boolean = false,
        public buyer_confirmed_at: Date | null = null,
        public supplier_confirmed_at: Date | null = null,
        public exchange_rate_id: string | null = null,
        public payment_currency: string = 'USD',
        public created_at: Date | null = null,
        public updated_at: Date | null = null
    ) { }
}
