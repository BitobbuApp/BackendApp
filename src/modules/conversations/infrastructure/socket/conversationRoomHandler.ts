import { Socket } from 'socket.io';
import { prisma } from '../../../../shared/infrastructure/database';
import logger from '../../../../shared/infrastructure/logger';

export const JOIN_CONVERSATION_EVENT = 'join_conversation';
export const LEAVE_CONVERSATION_EVENT = 'leave_conversation';
export const JOIN_ERROR_EVENT = 'join_error';

/**
 * Conversation rooms: a socket can only join the room of a conversation its company participates in.
 * Everything emitted to a conversation room (messages, typing, quote/transaction events) relies on this check.
 */
export function registerConversationRoomHandlers(socket: Socket) {
    socket.on(JOIN_CONVERSATION_EVENT, async (conversationId: unknown) => {
        const companyId = socket.data.user?.companyId;
        if (!companyId || typeof conversationId !== 'string') return;

        try {
            const conversation = await prisma.conversation.findFirst({
                where: {
                    id: conversationId,
                    OR: [{ participant_1_id: companyId }, { participant_2_id: companyId }],
                },
                select: { id: true },
            });

            if (!conversation) {
                logger.warn(`Socket ${socket.id} (company ${companyId}) denied access to conversation ${conversationId}`);
                socket.emit(JOIN_ERROR_EVENT, { conversation_id: conversationId, code: 'FORBIDDEN' });
                return;
            }

            socket.join(conversationId);
            logger.info(`Socket ${socket.id} se unió a la conversación: ${conversationId}`);
        } catch (err) {
            // e.g. a malformed id rejected by the database
            logger.warn({ err }, `Socket ${socket.id} failed to join conversation ${conversationId}`);
            socket.emit(JOIN_ERROR_EVENT, { conversation_id: conversationId, code: 'FORBIDDEN' });
        }
    });

    socket.on(LEAVE_CONVERSATION_EVENT, (conversationId: string) => {
        socket.leave(conversationId);
        logger.info(`Socket ${socket.id} abandonó la conversación: ${conversationId}`);
    });
}
