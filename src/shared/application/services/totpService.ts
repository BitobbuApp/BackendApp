import crypto from 'crypto';

// Base32 alphabet according to RFC 4648
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export interface VerifyTotpResult {
    valid: boolean;
    step?: bigint;
}

export interface GeneratedRecoveryCodes {
    rawCodes: string[];
    hashedCodes: string[];
}

export class TotpService {
    private readonly stepSeconds: number = 30;
    private readonly digits: number = 6;
    private readonly issuer: string;

    constructor() {
        this.issuer = process.env.TOTP_ISSUER || 'Bitobbu';
    }

    /**
     * Generates a 20-byte cryptographically secure random secret encoded in RFC 4648 Base32.
     */
    generateSecret(byteLength: number = 20): string {
        const buffer = crypto.randomBytes(byteLength);
        return this.base32Encode(buffer);
    }

    /**
     * Formats the otpauth:// URI recognized by Google Authenticator, Authy, 1Password, etc.
     */
    generateOtpAuthUri(email: string, secret: string): string {
        const label = encodeURIComponent(`${this.issuer}:${email.trim()}`);
        const issuerParam = encodeURIComponent(this.issuer);
        return `otpauth://totp/${label}?secret=${secret}&issuer=${issuerParam}&algorithm=SHA1&digits=${this.digits}&period=${this.stepSeconds}`;
    }

    /**
     * Verifies a 6-digit TOTP code against a Base32 secret with a ±1 step drift tolerance (RFC 6238).
     * Enforces anti-replay protection using lastUsedStep.
     */
    verifyTotp(
        code: string,
        secretBase32: string,
        lastUsedStep?: bigint | null,
        timestampMs: number = Date.now()
    ): VerifyTotpResult {
        const cleanCode = code.replace(/\s+/g, '');
        if (!/^\d{6}$/.test(cleanCode)) {
            return { valid: false };
        }

        const secretBytes = this.base32Decode(secretBase32);
        const currentStep = BigInt(Math.floor(timestampMs / 1000 / this.stepSeconds));

        // Window of ±1 step: current - 1, current, current + 1
        for (let offset = -1; offset <= 1; offset++) {
            const step = currentStep + BigInt(offset);

            // Anti-replay: Reject if this step or a newer step was already consumed
            if (lastUsedStep !== undefined && lastUsedStep !== null && step <= lastUsedStep) {
                continue;
            }

            const expectedCode = this.generateCodeForStep(secretBytes, step);
            if (crypto.timingSafeEqual(Buffer.from(cleanCode), Buffer.from(expectedCode))) {
                return { valid: true, step };
            }
        }

        return { valid: false };
    }

    /**
     * Generates 10 single-use recovery codes in XXXXX-XXXXX format,
     * returning both plain text (for one-time display to user) and SHA-256 hashes (for storage).
     */
    generateRecoveryCodes(count: number = 10): GeneratedRecoveryCodes {
        const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Unambiguous chars
        const rawCodes: string[] = [];
        const hashedCodes: string[] = [];

        for (let i = 0; i < count; i++) {
            const bytes = crypto.randomBytes(10);
            let code = '';
            for (let j = 0; j < 10; j++) {
                code += charset[bytes[j]! % charset.length];
                if (j === 4) code += '-';
            }
            rawCodes.push(code);
            hashedCodes.push(this.hashRecoveryCode(code));
        }

        return { rawCodes, hashedCodes };
    }

    /**
     * Normalizes and hashes a recovery code with SHA-256.
     */
    hashRecoveryCode(code: string): string {
        const normalized = code.toUpperCase().replace(/[^A-Z0-9]/g, '');
        return crypto.createHash('sha256').update(normalized).digest('hex');
    }

    /**
     * Generates standard RFC 4226 / RFC 6238 HOTP/TOTP token for a specific 64-bit step counter.
     */
    private generateCodeForStep(secret: Buffer, step: bigint): string {
        const buffer = Buffer.alloc(8);
        buffer.writeBigUInt64BE(step, 0);

        const hmac = crypto.createHmac('sha1', secret).update(buffer).digest();
        const offset = hmac[hmac.length - 1]! & 0x0f;

        const binary =
            ((hmac[offset]! & 0x7f) << 24) |
            ((hmac[offset + 1]! & 0xff) << 16) |
            ((hmac[offset + 2]! & 0xff) << 8) |
            (hmac[offset + 3]! & 0xff);

        const token = binary % 10 ** this.digits;
        return token.toString().padStart(this.digits, '0');
    }

    private base32Encode(buffer: Buffer): string {
        let bits = 0;
        let value = 0;
        let output = '';

        for (let i = 0; i < buffer.length; i++) {
            value = (value << 8) | buffer[i]!;
            bits += 8;

            while (bits >= 5) {
                output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }

        if (bits > 0) {
            output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
        }

        return output;
    }

    private base32Decode(base32: string): Buffer {
        const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
        let bits = 0;
        let value = 0;
        const bytes: number[] = [];

        for (let i = 0; i < clean.length; i++) {
            const index = BASE32_ALPHABET.indexOf(clean[i]!);
            if (index === -1) {
                throw new Error(`Invalid base32 character: ${clean[i]}`);
            }

            value = (value << 5) | index;
            bits += 5;

            if (bits >= 8) {
                bytes.push((value >>> (bits - 8)) & 255);
                bits -= 8;
            }
        }

        return Buffer.from(bytes);
    }
}
