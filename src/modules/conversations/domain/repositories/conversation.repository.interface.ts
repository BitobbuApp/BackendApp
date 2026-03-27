import { Conversation } from '../entities/conversation.entity';

export interface IConversationRepository {
    create(data: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>): Promise<Conversation>;
    findById(id: string): Promise<Conversation | null>;
    findByParticipants(participant_1_id: string, participant_2_id: string): Promise<Conversation | null>;
    findByTransactionId(transactionId: string): Promise<Conversation | null>;
    listByUser(userId: string): Promise<Conversation[]>;
    updateLastMessage(id: string, message: string, date: Date, unreadUserId: string): Promise<Conversation>;
    resetUnreadCount(id: string, userId: string): Promise<Conversation>;
}
