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
        const db = await prisma.conversation.findUnique({
            where: { id },
            include: {
                participant_1: {
                    select: { id: true, trade_name: true, logo_url: true }
                },
                participant_2: {
                    select: { id: true, trade_name: true, logo_url: true }
                },
                request: {
                    select: {
                        product_service: true,
                        quantity: true,
                        unit_of_measure: {
                            select: { abbreviation: true }
                        }
                    }
                },
                quote_response: {
                    select: {
                        unit_price_usd: true,
                        quantity: true
                    }
                }
            }
        });
        return db ? this.mapToEntity(db) : null;
    }

    async findByParticipants(participant_1_id: string, participant_2_id: string): Promise<Conversation | null> {
        // Since either could be P1 or P2, we check both orderings
        const db = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { participant_1_id, participant_2_id },
                    { participant_1_id: participant_2_id, participant_2_id: participant_1_id }
                ]
            }
        });
        return db ? this.mapToEntity(db) : null;
    }

    async findByTransactionId(transactionId: string): Promise<Conversation | null> {
        const db = await prisma.conversation.findUnique({
            where: { transaction_id: transactionId }
        });
        return db ? this.mapToEntity(db) : null;
    }

    async listByUser(userId: string): Promise<Conversation[]> {
        const list = await prisma.conversation.findMany({
            where: {
                AND: [
                    {
                        OR: [
                            { participant_1_id: userId },
                            { participant_2_id: userId }
                        ]
                    },
                    {
                        status: {
                            notIn: ['completed', 'cancelled']
                        }
                    }
                ]
            },
            include: {
                participant_1: {
                    select: { id: true, trade_name: true, logo_url: true }
                },
                participant_2: {
                    select: { id: true, trade_name: true, logo_url: true }
                },
                request: {
                    select: {
                        product_service: true,
                        quantity: true,
                        unit_of_measure: {
                            select: { abbreviation: true }
                        }
                    }
                },
                quote_response: {
                    select: {
                        unit_price_usd: true,
                        quantity: true
                    }
                }
            },
            orderBy: {
                last_message_date: 'desc'
            }
        });
        return list.map(item => this.mapToEntity(item));
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

        const updated = await prisma.conversation.update({
            where: { id },
            data: updateData
        });
        return this.mapToEntity(updated);
    }

    async resetUnreadCount(id: string, userId: string): Promise<Conversation> {
        const conv = await prisma.conversation.findUnique({ where: { id } });
        if (!conv) throw new Error('Conversation not found');

        const isP1 = conv.participant_1_id === userId;
        const updateData: any = {};
        if (isP1) updateData.unread_count_1 = 0;
        else updateData.unread_count_2 = 0;

        const updated = await prisma.conversation.update({
            where: { id },
            data: updateData
        });
        return this.mapToEntity(updated);
    }

    private mapToEntity(db: any): Conversation {
        return {
            id: db.id,
            participant_1_id: db.participant_1_id,
            participant_2_id: db.participant_2_id,
            request_id: db.request_id,
            quote_response_id: db.quote_response_id,
            transaction_id: db.transaction_id,
            status: db.status,
            last_message: db.last_message,
            last_message_date: db.last_message_date,
            unread_count_1: db.unread_count_1,
            unread_count_2: db.unread_count_2,
            created_at: db.created_at,
            updated_at: db.updated_at,
            participant_1: db.participant_1,
            participant_2: db.participant_2,
            request: db.request ? {
                product_service: db.request.product_service,
                quantity: Number(db.request.quantity || 0),
                unit_of_measure: db.request.unit_of_measure,
            } : undefined,
            quote_response: db.quote_response ? {
                unit_price_usd: Number(db.quote_response.unit_price_usd || 0),
                quantity: Number(db.quote_response.quantity || 0),
            } : undefined,
        };
    }
}
