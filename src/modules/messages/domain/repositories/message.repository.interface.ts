import { Message } from '../entities/message.entity';

export interface IMessageRepository {
    create(data: Omit<Message, 'id' | 'created_at' | 'is_read' | 'read_at'>): Promise<Message>;
    findByClientMsgId(clientMsgId: string): Promise<Message | null>;
    listByConversation(conversationId: string, limit?: number, offset?: number): Promise<Message[]>;
    markAsRead(conversationId: string, readerUserId: string): Promise<void>;
}
