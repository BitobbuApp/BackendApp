export interface Conversation {
    id?: string;
    participant_1_id: string;
    participant_2_id: string;
    request_id?: string | null;
    quote_response_id?: string | null;
    transaction_id?: string | null;
    status?: string;
    last_message?: string | null;
    last_message_date?: Date | null;
    unread_count_1?: number;
    unread_count_2?: number;
    created_at?: Date;
    updated_at?: Date;
    // Relations for negotiation context
    request?: {
        product_service: string;
        quantity: number;
        serial_number?: number | null;
        unit_of_measure?: {
            abbreviation: string;
        };
    } | null | undefined;
    quote_response?: {
        unit_price_usd: number;
        quantity: number;
        serial_number?: number | null;
    } | null | undefined;
    transaction?: {
        serial_number?: number | null;
    } | null | undefined;
    participant_1?: any;
    participant_2?: any;
}
