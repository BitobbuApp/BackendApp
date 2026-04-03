import { IConversationRepository } from '../../domain/repositories/conversation.repository.interface';
import { Conversation } from '../../domain/entities/conversation.entity';
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaConversationRepository implements IConversationRepository {
    async create(data: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>): Promise<Conversation> {
        // Build data object avoiding undefined
        const createData: any = {
            participant_1_id: data.participant_1_id,
            participant_2_id: data.participant_2_id,
        };
        if (data.request_id) createData.request_id = data.request_id;
        if (data.quote_response_id) createData.quote_response_id = data.quote_response_id;
        if (data.transaction_id) createData.transaction_id = data.transaction_id;

        const created = await prisma.conversation.create({
            data: createData,
        });
        return created;
    }

    async findById(id: string): Promise<Conversation | null> {
        return await prisma.conversation.findUnique({
            where: { id },
            include: {
                participant_1: {
                    select: { id: true, trade_name: true, logo_url: true }
                },
                participant_2: {
                    select: { id: true, trade_name: true, logo_url: true }
                }
            }
        });
    }

    async findByParticipants(participant_1_id: string, participant_2_id: string): Promise<Conversation | null> {
        // Since either could be P1 or P2, we check both orderings
        return await prisma.conversation.findFirst({
            where: {
                OR: [
                    { participant_1_id, participant_2_id },
                    { participant_1_id: participant_2_id, participant_2_id: participant_1_id }
                ]
            }
        });
    }

    async findByTransactionId(transactionId: string): Promise<Conversation | null> {
        return await prisma.conversation.findUnique({
            where: { transaction_id: transactionId }
        });
    }

    async listByUser(userId: string): Promise<Conversation[]> {
        return await prisma.conversation.findMany({
            where: {
                OR: [
                    { participant_1_id: userId },
                    { participant_2_id: userId }
                ]
            },
            include: {
                participant_1: {
                    select: { id: true, trade_name: true, logo_url: true }
                },
                participant_2: {
                    select: { id: true, trade_name: true, logo_url: true }
                }
            },
            orderBy: {
                last_message_date: 'desc'
            }
        });
    }

    async updateLastMessage(id: string, message: string, date: Date, unreadUserId: string): Promise<Conversation> {
        // unreadUserId is the sender; increment the counter for the other participant
        const conv = await prisma.conversation.findUnique({ where: { id } });
        if (!conv) throw new Error('Conversation not found');

        const senderIsP1 = conv.participant_1_id === unreadUserId;
        const updateData: any = {
            last_message: message,
            last_message_date: date,
        };
        if (senderIsP1) updateData.unread_count_2 = { increment: 1 };
        else updateData.unread_count_1 = { increment: 1 };

        return await prisma.conversation.update({
            where: { id },
            data: updateData
        });
    }

    async resetUnreadCount(id: string, userId: string): Promise<Conversation> {
        const conv = await prisma.conversation.findUnique({ where: { id } });
        if (!conv) throw new Error('Conversation not found');

        const isP1 = conv.participant_1_id === userId;
        const updateData: any = {};
        if (isP1) updateData.unread_count_1 = 0;
        else updateData.unread_count_2 = 0;

        return await prisma.conversation.update({
            where: { id },
            data: updateData
        });
    }
}
