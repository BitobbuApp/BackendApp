import { Socket } from 'socket.io';
import { PrismaMessageRepository } from '../persistence/PrismaMessageRepository';
import { PrismaConversationRepository } from '../../../conversations/infrastructure/persistence/PrismaConversationRepository';
import { CreateMessageUseCase } from '../../application/createMessageUseCase';

export function registerMessageHandlers(socket: Socket) {
    const messageRepo = new PrismaMessageRepository();
    const convRepo = new PrismaConversationRepository();
    const createMessageUseCase = new CreateMessageUseCase(messageRepo, convRepo);

    socket.on('send_message', async (payload: {
        conversation_id: string;
        client_msg_id?: string;
        content?: string;
        file_url?: string;
        file_name?: string;
    }, callback?: (response: any) => void) => {
        try {
            // Extract sender from socket auth data
            const senderId = socket.data.user?.companyId || socket.data.user?.userId;
            if (!senderId) {
                const errorResp = { status: 'error', code: 'UNAUTHORIZED', message: 'Sender ID missing in socket' };
                if (callback) callback(errorResp);
                else socket.emit('message_error', errorResp);
                return;
            }

            // Create message via Use Case (handles idempotency and unread counts)
            const result = await createMessageUseCase.execute({
                conversation_id: payload.conversation_id,
                sender_id: senderId,
                client_msg_id: payload.client_msg_id || null,
                content: payload.content || null,
                file_url: payload.file_url || null,
                file_name: payload.file_name || null
            });

            // If callback provided (acknowledgement), confirm receipt immediately to sender
            if (callback) {
                callback({ status: 'success', data: result.message, isDuplicate: result.isDuplicate });
            }

            // If it's a NEW message, broadcast to the room (conversation_id)
            if (!result.isDuplicate) {
                // We broadcast to everyone in the room EXCEPT the sender's own socket (sender already knows)
                // However, emitting to the whole room is often safer if the sender has multiple tabs open
                socket.to(payload.conversation_id).emit('receive_message', result.message);
            }
            
        } catch (error: any) {
            console.error('[Socket send_message error]', error);
            const errorResp = { status: 'error', message: 'Failed to process message' };
            if (callback) callback(errorResp);
            else socket.emit('message_error', errorResp);
        }
    });

    // We can also let the socket mark a chat as read while staying connected
    socket.on('mark_read', async (payload: { conversation_id: string }) => {
        const userId = socket.data.user?.companyId || socket.data.user?.userId;
        if (userId && payload.conversation_id) {
            await messageRepo.markAsRead(payload.conversation_id, userId);
            await convRepo.resetUnreadCount(payload.conversation_id, userId);
            // Optionally, we could emit 'conversation_read' to the room so the other party sees "read receipts"
            socket.to(payload.conversation_id).emit('conversation_read', {
                conversation_id: payload.conversation_id,
                read_by: userId,
                timestamp: new Date().toISOString()
            });
        }
    });
}
