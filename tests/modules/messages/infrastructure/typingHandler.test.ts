import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { registerTypingHandlers } from '../../../../src/modules/messages/infrastructure/socket/typingHandler';

const CONVERSATION_ID = '88888888-8888-4888-8888-888888888888';
const COMPANY = '22222222-2222-4222-8222-222222222222';

/** Minimal Socket.IO socket double: captures handlers and broadcasts. */
function fakeSocket({ companyId = COMPANY as string | null, rooms = [CONVERSATION_ID] } = {}) {
    const handlers: Record<string, (payload: any) => void> = {};
    const broadcasts: Array<{ room: string; event: string; payload: any }> = [];
    const socket: any = {
        data: { user: companyId ? { companyId } : undefined },
        rooms: new Set(rooms),
        on: (event: string, handler: any) => { handlers[event] = handler; },
        to: (room: string) => ({
            emit: (event: string, payload: any) => { broadcasts.push({ room, event, payload }); }
        }),
    };
    registerTypingHandlers(socket);
    return { typing: (payload: any) => handlers['typing'](payload), broadcasts };
}

describe('typing socket handler', () => {
    test('relays the typing state to the rest of the conversation room', () => {
        const { typing, broadcasts } = fakeSocket();
        typing({ conversation_id: CONVERSATION_ID, is_typing: true });

        assert.deepEqual(broadcasts, [{
            room: CONVERSATION_ID,
            event: 'user_typing',
            payload: { conversation_id: CONVERSATION_ID, company_id: COMPANY, is_typing: true },
        }]);
    });

    test('relays the stop typing state', () => {
        const { typing, broadcasts } = fakeSocket();
        typing({ conversation_id: CONVERSATION_ID, is_typing: false });
        assert.equal(broadcasts[0].payload.is_typing, false);
    });

    test('ignores sockets that did not join the conversation', () => {
        const { typing, broadcasts } = fakeSocket({ rooms: [] });
        typing({ conversation_id: CONVERSATION_ID, is_typing: true });
        assert.equal(broadcasts.length, 0);
    });

    test('ignores unauthenticated sockets and invalid payloads', () => {
        const anonymous = fakeSocket({ companyId: null });
        anonymous.typing({ conversation_id: CONVERSATION_ID, is_typing: true });
        assert.equal(anonymous.broadcasts.length, 0);

        const { typing, broadcasts } = fakeSocket();
        typing({ conversation_id: CONVERSATION_ID, is_typing: 'yes' });
        typing({ conversation_id: 123, is_typing: true });
        typing(undefined);
        assert.equal(broadcasts.length, 0);
    });
});
