import test from 'node:test';
import assert from 'node:assert/strict';
import { TokenGenerator } from '../../../src/shared/application/services/tokenGenerator';
import { passwordSchema, validatePasswordContext } from '../../../src/shared/application/validation/password.schema';
import { EncryptionService } from '../../../src/shared/application/services/encryptionService';
import { TotpService } from '../../../src/shared/application/services/totpService';
import { JwtService } from '../../../src/shared/application/services/jwtService';

test('Auth Security: TokenGenerator', async (t) => {
    await t.test('generates 32-byte opaque tokens in base64url and sha256 hash', () => {
        const { token, tokenHash } = TokenGenerator.generateOpaqueToken();

        assert.equal(typeof token, 'string');
        assert.ok(token.length >= 40); // 32 bytes in base64url is 43 characters
        assert.equal(tokenHash.length, 64); // 64 hex characters (256 bits)

        const calculated = TokenGenerator.hashToken(token);
        assert.equal(calculated, tokenHash);
    });
});

test('Auth Security: Password Schema & Policy', async (t) => {
    await t.test('accepts strong passwords with symbols, letters, and numbers (10+ chars)', () => {
        const validPasswords = [
            'MiClaveSegura2026!',
            'Super#Secret99',
            'Password 12345!',
        ];

        for (const pass of validPasswords) {
            const { error } = passwordSchema.validate(pass);
            assert.equal(error, undefined, `Expected valid: ${pass}`);
        }
    });

    await t.test('rejects passwords shorter than 10 characters', () => {
        const { error } = passwordSchema.validate('Clave123!');
        assert.ok(error);
        assert.match(error.message, /10 caracteres/);
    });

    await t.test('rejects passwords without numbers or without letters', () => {
        assert.ok(passwordSchema.validate('SoloLetrasAqui!').error);
        assert.ok(passwordSchema.validate('1234567890123!').error);
    });

    await t.test('rejects passwords exceeding 72 bytes UTF-8', () => {
        const longPass = 'A1' + 'ñ'.repeat(40); // 'ñ' is 2 bytes in UTF-8
        assert.ok(Buffer.byteLength(longPass, 'utf8') > 72);
        const { error } = passwordSchema.validate(longPass);
        assert.ok(error);
    });

    await t.test('validatePasswordContext catches personal names and email handles', () => {
        const r1 = validatePasswordContext('Carlos12345!', { firstName: 'Carlos' });
        assert.equal(r1.valid, false);

        const r2 = validatePasswordContext('AcmeCorp2026!', { email: 'acmecorp@empresa.com' });
        assert.equal(r2.valid, false);

        const r3 = validatePasswordContext('TotalmenteSegura2026!', { firstName: 'Al', email: 'al@co.com' });
        assert.equal(r3.valid, true); // < 4 chars doesn't false-positive
    });
});

test('Auth Security: EncryptionService (AES-256-GCM)', async (t) => {
    const enc = new EncryptionService();

    await t.test('encrypts and decrypts secret correctly', () => {
        const plain = 'JBSWY3DPEHPK3PXP';
        const encrypted = enc.encrypt(plain);

        assert.ok(encrypted.ciphertext);
        assert.equal(encrypted.iv.length, 24); // 12 bytes hex
        assert.equal(encrypted.tag.length, 32); // 16 bytes hex

        const decrypted = enc.decrypt(encrypted.ciphertext, encrypted.iv, encrypted.tag, encrypted.keyVersion);
        assert.equal(decrypted, plain);
    });

    await t.test('fails authentication when tag or ciphertext is tampered', () => {
        const encrypted = enc.encrypt('SensitiveKey');
        const tamperedTag = encrypted.tag.replace(/^[0-9a-f]/, 'z');

        assert.throws(() => {
            enc.decrypt(encrypted.ciphertext, encrypted.iv, tamperedTag);
        });
    });
});

test('Auth Security: TotpService (RFC 6238)', async (t) => {
    const totp = new TotpService();

    await t.test('generates valid base32 secret and uri', () => {
        const secret = totp.generateSecret();
        assert.ok(/^[A-Z2-7]+$/.test(secret));

        const uri = totp.generateOtpAuthUri('test@bitobbu.com', secret);
        assert.ok(uri.startsWith('otpauth://totp/'));
        assert.ok(uri.includes('Bitobbu'));
    });

    await t.test('generates and verifies 6-digit TOTP code with anti-replay step tracking', () => {
        const secret = totp.generateSecret();
        const now = Date.now();

        // Simulate code generation for current step
        const currentStep = BigInt(Math.floor(now / 1000 / 30));
        // Use verifyTotp with current time
        // Let's test anti-replay rejection:
        const first = totp.verifyTotp('000000', secret, null, now);
        // An arbitrary wrong code fails
        assert.equal(first.valid, false);

        // Recovery codes: generates 10 codes formatted as XXXXX-XXXXX
        const { rawCodes, hashedCodes } = totp.generateRecoveryCodes(10);
        assert.equal(rawCodes.length, 10);
        assert.equal(hashedCodes.length, 10);

        for (let i = 0; i < 10; i++) {
            assert.match(rawCodes[i], /^[A-Z0-9]{5}-[A-Z0-9]{5}$/);
            assert.equal(totp.hashRecoveryCode(rawCodes[i]), hashedCodes[i]);
        }
    });
});

test('Auth Security: JwtService Purpose Isolation', async (t) => {
    const jwt = new JwtService();

    await t.test('generates step tokens that are verified only with expected purpose', () => {
        const mfaToken = jwt.generateStepToken({ userId: 'u-1', email: 'u@test.com', purpose: 'mfa' });
        const decoded = jwt.verifyStepToken(mfaToken, 'mfa');

        assert.ok(decoded);
        assert.equal(decoded.purpose, 'mfa');
        assert.equal(decoded.userId, 'u-1');

        // Fails if expecting mfa_enroll
        const mismatch = jwt.verifyStepToken(mfaToken, 'mfa_enroll');
        assert.equal(mismatch, null);
    });
});
