import { test, describe, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../../src/shared/infrastructure/database';
import { registerConversationRoomHandlers } from '../../../../src/modules/conversations/infrastructure/socket/conversationRoomHandler';
import { stub, restoreAll, recorder } from '../../../helpers/stubs';

const CONVERSATION_ID = '88888888-8888-4888-8888-888888888888';
const PARTICIPANT = '22222222-2222-4222-8222-222222222222';
const OUTSIDER = '44444444-4444-4444-8444-444444444444';

/** Minimal socket double that records joins, leaves and direct emits. */
function fakeSocket(companyId: string | null) {
    const handlers: Record<string, (payload: any) => any> = {};
    const joined: string[] = [];
    const left: string[] = [];
    const emitted: Array<{ event: string; payload: any }> = [];
    const socket: any = {
        id: 'socket-1',
        data: { user: companyId ? { companyId } : undefined },
        on: (event: string, handler: any) => { handlers[event] = handler; },
        join: (room: string) => { joined.push(room); },
        leave: (room: string) => { left.push(room); },
        emit: (event: string, payload: any) => { emitted.push({ event, payload }); },
    };
    registerConversationRoomHandlers(socket);
    return {
        join: (id: any) => handlers['join_conversation'](id),
        leave: (id: any) => handlers['leave_conversation'](id),
        joined, left, emitted,
    };
}

/** Membership lookup: the conversation only exists for PARTICIPANT. */
function stubMembership() {
    const findFirst = recorder(async ({ where }: any) =>
        where.OR.some((c: any) => Object.values(c).includes(PARTICIPANT)) ? { id: where.id } : null
    );
    stub(prisma.conversation, 'findFirst', findFirst);
    return findFirst;
}

afterEach(restoreAll);

describe('join_conversation', () => {
    test('a participant joins the conversation room', async () => {
        const findFirst = stubMembership();
        const socket = fakeSocket(PARTICIPANT);
        await socket.join(CONVERSATION_ID);

        assert.deepEqual(socket.joined, [CONVERSATION_ID]);
        assert.equal(socket.emitted.length, 0);
        assert.deepEqual(findFirst.calls[0][0].where, {
            id: CONVERSATION_ID,
            OR: [{ participant_1_id: PARTICIPANT }, { participant_2_id: PARTICIPANT }],
        });
    });

    test('a non participant is rejected with join_error', async () => {
        stubMembership();
        const socket = fakeSocket(OUTSIDER);
        await socket.join(CONVERSATION_ID);

        assert.equal(socket.joined.length, 0);
        assert.deepEqual(socket.emitted, [{
            event: 'join_error',
            payload: { conversation_id: CONVERSATION_ID, code: 'FORBIDDEN' },
        }]);
    });

    test('a database error (e.g. malformed id) is rejected without joining', async () => {
        stub(prisma.conversation, 'findFirst', async () => { throw new Error('invalid uuid'); });
        const socket = fakeSocket(PARTICIPANT);
        await socket.join('not-a-uuid');

        assert.equal(socket.joined.length, 0);
        assert.equal(socket.emitted[0].event, 'join_error');
    });

    test('ignores unauthenticated sockets and invalid payloads', async () => {
        const findFirst = stubMembership();
        const anonymous = fakeSocket(null);
        await anonymous.join(CONVERSATION_ID);

        const socket = fakeSocket(PARTICIPANT);
        await socket.join({ id: CONVERSATION_ID });
        await socket.join(undefined);

        assert.equal(anonymous.joined.length + socket.joined.length, 0);
        assert.equal(findFirst.calls.length, 0);
    });
});

describe('leave_conversation', () => {
    test('leaves the room', () => {
        const socket = fakeSocket(PARTICIPANT);
        socket.leave(CONVERSATION_ID);
        assert.deepEqual(socket.left, [CONVERSATION_ID]);
    });
});
