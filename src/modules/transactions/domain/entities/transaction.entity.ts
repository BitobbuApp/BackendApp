export class Transaction {
    constructor(
        public id: string,
        public quote_response_id: string,
        public buyer_id: string,
        public supplier_id: string,
        public product_description: string,
        public unit_price: number,
        public quantity: number,
        public total_amount: number,
        public payment_method: string | null = null,
        public payment_conditions: string | null = null,
        public delivery_time: string | null = null,
        public status: string = 'In Process',
        public estimated_delivery_date: Date | null = null,
        public actual_delivery_date: Date | null = null,
        public cancellation_reason: string | null = null,
        public buyer_confirmed: boolean = false,
        public supplier_confirmed: boolean = false,
        public buyer_confirmed_at: Date | null = null,
        public supplier_confirmed_at: Date | null = null,
        public created_at: Date | null = null,
        public updated_at: Date | null = null
    ) { }
}
