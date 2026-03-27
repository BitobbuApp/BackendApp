export interface Conversation {
    id?: string;
    participant_1_id: string;
    participant_2_id: string;
    request_id?: string | null;
    quote_response_id?: string | null;
    transaction_id?: string | null;
    last_message?: string | null;
    last_message_date?: Date | null;
    unread_count_1?: number;
    unread_count_2?: number;
    created_at?: Date;
    updated_at?: Date;
}
