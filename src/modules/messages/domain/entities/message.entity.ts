export interface Message {
    id?: string;
    conversation_id: string;
    sender_id?: string | null;
    message_type?: string;
    event_key?: string | null;
    event_payload?: any | null;
    client_msg_id?: string | null;
    content?: string | null;
    file_url?: string | null;
    file_name?: string | null;
    is_read?: boolean;
    read_at?: Date | null;
    created_at?: Date;
}
