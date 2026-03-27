export interface Message {
    id?: string;
    conversation_id: string;
    sender_id: string;
    client_msg_id?: string | null;
    content?: string | null;
    file_url?: string | null;
    file_name?: string | null;
    is_read?: boolean;
    read_at?: Date | null;
    created_at?: Date;
}
