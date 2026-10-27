import { Socket } from 'socket.io';

export const TYPING_EVENT = 'typing';
export const USER_TYPING_EVENT = 'user_typing';

/**
 * "Is typing" indicator for conversations.
 * Ephemeral by design: nothing is persisted, the state is only relayed to the other sockets in the room.
 * The client throttles the emits; the receiver expires the indicator if no refresh arrives.
 */
export function registerTypingHandlers(socket: Socket) {
    socket.on(TYPING_EVENT, (payload: { conversation_id?: unknown; is_typing?: unknown }) => {
        const companyId = socket.data.user?.companyId;
        const conversationId = payload?.conversation_id;
        const isTyping = payload?.is_typing;

        if (!companyId || typeof conversationId !== 'string' || typeof isTyping !== 'boolean') return;

        // Only sockets that joined the conversation room can broadcast typing state to it
        if (!socket.rooms.has(conversationId)) return;

        socket.to(conversationId).emit(USER_TYPING_EVENT, {
            conversation_id: conversationId,
            company_id: companyId,
            is_typing: isTyping,
        });
    });
}
