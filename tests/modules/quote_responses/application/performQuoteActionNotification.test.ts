import { test, describe, afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../../../../src/shared/infrastructure/database';
import { PerformQuoteActionUseCase } from '../../../../src/modules/quote_responses/application/performQuoteActionUseCase';
import { CreateSystemMessageUseCase } from '../../../../src/modules/messages/application/createSystemMessageUseCase';
import { stub, restoreAll, recorder, spyIO, SocketEmit } from '../../../helpers/stubs';

const QUOTE_ID = '77777777-7777-4777-8777-777777777777';
const REQUEST_ID = '11111111-1111-4111-8111-111111111111';
const BUYER = '22222222-2222-4222-8222-222222222222';
const SUPPLIER = '33333333-3333-4333-8333-333333333333';
const CONVERSATION_ID = '88888888-8888-4888-8888-888888888888';

const result = {
    id: QUOTE_ID,
    request_id: REQUEST_ID,
    supplier_id: SUPPLIER,
    status: 'negotiating',
    unit_price_usd: 10,
    quantity: 5,
    total_amount_usd: 50,
};

let emits: SocketEmit[];
let notifications: ReturnType<typeof recorder>;
let systemMessages: ReturnType<typeof recorder>;

beforeEach(() => {
    emits = spyIO();
    stub(prisma.conversation, 'findFirst', async () => ({ id: CONVERSATION_ID, status: 'active' }));
    stub(prisma.request, 'findUniqueOrThrow', async () => ({ company_id: BUYER }));
    notifications = recorder(async ({ data }: any) => ({ id: 'notif', ...data, created_at: new Date() }));
    stub(prisma.notification, 'create', notifications);
    systemMessages = recorder(async () => ({}));
    stub(CreateSystemMessageUseCase.prototype, 'execute', systemMessages);
});

afterEach(restoreAll);

/** emitSocketEvent is fire-and-forget inside implementation, so it is awaited directly here. */
const emit = (action: string, actorCompanyId: string) =>
    (new PerformQuoteActionUseCase() as any).emitSocketEvent(
        { quoteResponseId: QUOTE_ID, action, actorCompanyId, payload: {} },
        result
    );

describe('negotiation_started notifications', () => {
    test('buyer starts it → only the supplier is notified (regression)', async () => {
        await emit('negotiation_started', BUYER);

        const quoteEvents = emits.filter(e => e.event === 'quote:negotiation_started');
        assert.equal(quoteEvents.length, 1);
        assert.equal(quoteEvents[0].room, `company_${SUPPLIER}`);
        assert.equal(quoteEvents[0].payload.actor_role, 'buyer');
        assert.equal(quoteEvents[0].payload.new_conversation_id, CONVERSATION_ID);

        const notif = notifications.calls[0][0].data;
        assert.equal(notif.company_id, SUPPLIER);
        assert.equal(notif.message, 'Un comprador quiere negociar tu oferta.');
        assert.equal(notif.link, `/Chat/${CONVERSATION_ID}`);
        assert.ok(emits.some(e => e.event === 'notification:new' && e.room === `company_${SUPPLIER}`));
    });

    test('supplier starts it (direct RFQ) → only the buyer is notified', async () => {
        await emit('negotiation_started', SUPPLIER);

        const quoteEvents = emits.filter(e => e.event === 'quote:negotiation_started');
        assert.equal(quoteEvents.length, 1);
        assert.equal(quoteEvents[0].room, `company_${BUYER}`);
        assert.equal(quoteEvents[0].payload.actor_role, 'supplier');

        const notif = notifications.calls[0][0].data;
        assert.equal(notif.company_id, BUYER);
        assert.match(notif.message, /proveedor respondió tu solicitud directa/);
        assert.equal(notif.link, `/Chat/${CONVERSATION_ID}`);

        assert.ok(!emits.some(e => e.room === `company_${SUPPLIER}`), 'supplier must not be notified of its own action');
    });

    test('a system message is written to the conversation timeline', async () => {
        await emit('negotiation_started', SUPPLIER);
        assert.equal(systemMessages.calls[0][0].conversationId, CONVERSATION_ID);
        assert.equal(systemMessages.calls[0][0].eventKey, 'quote.negotiating');
    });
});

describe('other quote actions (regression)', () => {
    test('price_updated is emitted only to the conversation room, without notifications', async () => {
        await emit('price_updated', SUPPLIER);

        assert.deepEqual(emits.map(e => e.room), [CONVERSATION_ID]);
        assert.equal(emits[0].event, 'quote:updated');
        assert.equal(notifications.calls.length, 0);
    });
});
