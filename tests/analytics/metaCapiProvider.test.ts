import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { MetaCapiProvider, hashSha256, normalizePhoneForHash } from '../../src/modules/analytics/infrastructure/providers/metaCapiProvider';
import { ProcessAnalyticsEventUseCase } from '../../src/modules/analytics/application/processAnalyticsEvent';
import { AnalyticsEvent } from '../../src/modules/analytics/domain/analyticsEvent';
import { IAnalyticsProvider } from '../../src/modules/analytics/domain/analyticsProvider';

describe('MetaCapiProvider', () => {
    it('returns skipped when disabled in settings', async () => {
        let called = false;
        const provider = new MetaCapiProvider(
            () => ({ enabled: false, pixelId: '1611912130204587', accessToken: 'tok', apiVersion: 'v19.0', testEventCode: '' }),
            (async () => { called = true; return new Response('{}', { status: 200 }); }) as any,
        );

        assert.equal(provider.isEnabled(), false);
        const res = await provider.send({
            eventId: 'evt-1',
            name: 'user_registered',
            occurredAt: 1700000000,
            user: { email: 'user@example.com' },
        });
        assert.equal(res.sent, false);
        assert.equal(res.skippedReason, 'disabled_or_unconfigured');
        assert.equal(called, false);
    });

    it('hashes PII with SHA-256, maps canonical event name, and includes test_event_code', async () => {
        let capturedUrl = '';
        let capturedBody: any = null;
        const provider = new MetaCapiProvider(
            () => ({ enabled: true, pixelId: '1611912130204587', accessToken: 'secret-tok', apiVersion: 'v19.0', testEventCode: 'TEST1234' }),
            (async (url: string, init: any) => {
                capturedUrl = url;
                capturedBody = JSON.parse(init.body);
                return new Response(JSON.stringify({ events_received: 1 }), { status: 200 });
            }) as any,
        );

        const res = await provider.send({
            eventId: 'uuid-dedup-1',
            name: 'user_registered',
            occurredAt: 1700000000,
            sourceUrl: 'https://bitobbu.app/register',
            user: {
                email: '  Test@Bitobbu.App ',
                phone: '+58 (424) 214-9047',
                ip: '190.200.1.1',
                userAgent: 'Mozilla/5.0',
                browserIds: { fbp: 'fb.1.123.456' },
            },
        });

        assert.equal(res.sent, true);
        assert.equal(capturedUrl, 'https://graph.facebook.com/v19.0/1611912130204587/events?access_token=secret-tok');
        assert.equal(capturedBody.test_event_code, 'TEST1234');
        assert.equal(capturedBody.data[0].event_name, 'CompleteRegistration');
        assert.equal(capturedBody.data[0].event_id, 'uuid-dedup-1');
        assert.deepEqual(capturedBody.data[0].user_data.em, [hashSha256('test@bitobbu.app')]);
        assert.deepEqual(capturedBody.data[0].user_data.ph, [normalizePhoneForHash('584242149047')]);
        assert.equal(capturedBody.data[0].user_data.fbp, 'fb.1.123.456');
    });

    it('skips event when user_data has insufficient match parameters', async () => {
        let called = false;
        const provider = new MetaCapiProvider(
            () => ({ enabled: true, pixelId: '1611912130204587', accessToken: 'tok', apiVersion: 'v19.0', testEventCode: '' }),
            (async () => { called = true; return new Response('{}', { status: 200 }); }) as any,
        );

        const res = await provider.send({
            eventId: 'evt-empty',
            name: 'page_view',
            occurredAt: 1700000000,
        });
        assert.equal(res.sent, false);
        assert.equal(res.skippedReason, 'insufficient_user_data');
        assert.equal(called, false);
    });
});

describe('ProcessAnalyticsEventUseCase (provider-agnostic)', () => {
    it('dispatches to all enabled providers and ignores disabled ones', async () => {
        const delivered: string[] = [];
        const p1: IAnalyticsProvider = {
            name: 'provider-a',
            isEnabled: () => true,
            send: async (e: AnalyticsEvent) => { delivered.push(`a:${e.name}`); return { provider: 'provider-a', sent: true }; },
        };
        const p2: IAnalyticsProvider = {
            name: 'provider-b',
            isEnabled: () => false,
            send: async () => { delivered.push('b'); return { provider: 'provider-b', sent: false }; },
        };

        const useCase = new ProcessAnalyticsEventUseCase([p1, p2]);
        await useCase.execute({ eventId: '1', name: 'rfq_created', occurredAt: 1700000000 });
        assert.deepEqual(delivered, ['a:rfq_created']);
    });
});

