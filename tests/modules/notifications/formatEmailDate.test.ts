import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { formatEmailDate } from '../../../src/shared/application/services/formatEmailDate';
import { notifyTwoFactorChange } from '../../../src/modules/auth/application/helpers/notifyTwoFactorChange';

const MOMENT = new Date('2026-10-24T20:26:00Z');

describe('formatEmailDate', () => {
    test('is readable Spanish in Caracas time by default, never an ISO timestamp', () => {
        const text = formatEmailDate(MOMENT);
        assert.equal(text, '24 de octubre de 2026, 16:26');
        assert.doesNotMatch(text, /T\d{2}:\d{2}|Z$/);
    });

    test('uses the time zone of the user', () => {
        assert.equal(formatEmailDate(MOMENT, 'America/Bogota'), '24 de octubre de 2026, 15:26');
    });

    test('an invalid time zone falls back to Caracas instead of failing', () => {
        assert.equal(formatEmailDate(MOMENT, 'No/Existe'), '24 de octubre de 2026, 16:26');
    });
});

describe('dates in the security emails', () => {
    test('the 2FA notice sends a readable date', () => {
        const sent: any[] = [];
        notifyTwoFactorChange({ sendTemplate: async (m: any) => { sent.push(m); } } as any, { email: 'a@b.co', first_name: 'Ana' }, 'activado');
        assert.doesNotMatch(sent[0].variables.changed_at, /T\d{2}:\d{2}:\d{2}/);
        assert.match(sent[0].variables.changed_at, /^\d{1,2} de [a-záéíóú]+ de \d{4}, \d{1,2}:\d{2}$/);
    });
});
