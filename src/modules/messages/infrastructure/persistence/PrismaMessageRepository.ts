import { IMessageRepository } from '../../domain/repositories/message.repository.interface';
import { Message } from '../../domain/entities/message.entity';
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaMessageRepository implements IMessageRepository {
    async create(data: Omit<Message, 'id' | 'created_at' | 'is_read' | 'read_at'>): Promise<Message> {
        // Build data object avoiding undefined for strict optional property types
        const createData: any = {
            conversation_id: data.conversation_id,
            sender_id: data.sender_id ?? null,
        };
        if (data.message_type) createData.message_type = data.message_type;
        if (data.event_key) createData.event_key = data.event_key;
        if (data.event_payload !== undefined) createData.event_payload = data.event_payload;
        if (data.client_msg_id) createData.client_msg_id = data.client_msg_id;
        if (data.content !== undefined) createData.content = data.content;
        if (data.file_url) createData.file_url = data.file_url;
        if (data.file_name) createData.file_name = data.file_name;

        return await prisma.message.create({
            data: createData,
            include: {
                sender: {
                    select: { id: true, trade_name: true, logo_url: true }
                }
            }
        });
    }

    async findByClientMsgId(clientMsgId: string): Promise<Message | null> {
        if (!clientMsgId) return null;
        return await prisma.message.findUnique({
            where: { client_msg_id: clientMsgId },
            include: {
                sender: {
                    select: { id: true, trade_name: true, logo_url: true }
                }
            }
        });
    }

    async listByConversation(conversationId: string, limit = 50, offset = 0): Promise<Message[]> {
        return await prisma.message.findMany({
            where: { conversation_id: conversationId },
            orderBy: { created_at: 'asc' }, // Chat history is usually oldest first or newest first, let's keep chronological
            take: limit,
            skip: offset,
            include: {
                sender: {
                    select: { id: true, trade_name: true, logo_url: true }
                }
            }
        });
    }

    async markAsRead(conversationId: string, readerUserId: string): Promise<void> {
        // Find messages in the conversation where the sender is NOT the reader, and they are not read
        await prisma.message.updateMany({
            where: {
                conversation_id: conversationId,
                sender_id: { not: readerUserId },
                is_read: false,
            },
            data: {
                is_read: true,
                read_at: new Date(),
            }
        });
    }
}
