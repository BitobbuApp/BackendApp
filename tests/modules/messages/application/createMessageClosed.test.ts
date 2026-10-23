import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { CreateMessageUseCase } from '../../../../src/modules/messages/application/createMessageUseCase';
import { ConversationClosedError } from '../../../../src/modules/conversations/domain/errors/conversation.errors';

const CONVERSATION_ID = '88888888-8888-4888-8888-888888888888';
const BUYER = '22222222-2222-4222-8222-222222222222';
const SUPPLIER = '33333333-3333-4333-8333-333333333333';
const MESSAGE_ID = '99999999-9999-4999-8999-999999999999';

function setup(status: string) {
    const created: any[] = [];
    const messageRepo: any = {
        findByClientMsgId: async () => null,
        create: async (data: any) => {
            created.push(data);
            return { id: MESSAGE_ID, conversation_id: data.conversation_id, sender_id: data.sender_id, content: data.content, created_at: new Date() };
        },
    };
    const conversationRepo: any = {
        findById: async () => ({ id: CONVERSATION_ID, participant_1_id: BUYER, participant_2_id: SUPPLIER, status }),
        updateLastMessage: async () => undefined,
    };
    return { useCase: new CreateMessageUseCase(messageRepo, conversationRepo), created };
}

const send = (useCase: CreateMessageUseCase) =>
    useCase.execute({ conversation_id: CONVERSATION_ID, sender_id: SUPPLIER, content: 'Hola' });

describe('CreateMessageUseCase — closed conversations', () => {
    test('a closed (cancelled) negotiation is read-only', async () => {
        const { useCase, created } = setup('cancelled');
        await assert.rejects(send(useCase), ConversationClosedError);
        assert.equal(created.length, 0);
    });

    test('an active conversation accepts messages (regression)', async () => {
        const { useCase, created } = setup('active');
        const result = await send(useCase);
        assert.equal(result.message.id, MESSAGE_ID);
        assert.equal(created.length, 1);
    });
});
