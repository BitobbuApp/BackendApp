import crypto from 'crypto';

export interface EncryptedData {
    ciphertext: string;
    iv: string;
    tag: string;
    keyVersion: number;
}

export class EncryptionService {
    private readonly primaryKey: Buffer;
    private readonly currentVersion: number = 1;

    constructor() {
        const rawKey = process.env.TWO_FACTOR_ENC_KEY;
        if (!rawKey) {
            if (process.env.NODE_ENV === 'test' || process.env.ENVIRONMENT === 'test') {
                this.primaryKey = Buffer.alloc(32, 7); // Safe fallback buffer for automated test suites
            } else {
                throw new Error('TWO_FACTOR_ENC_KEY environment variable is required (32 bytes base64).');
            }
        } else {
            const buf = Buffer.from(rawKey, 'base64');
            if (buf.length !== 32) {
                throw new Error(`TWO_FACTOR_ENC_KEY must decode to exactly 32 bytes (received ${buf.length} bytes).`);
            }
            this.primaryKey = buf;
        }
    }

    /**
     * Encrypts plain text using AES-256-GCM with a fresh 12-byte initialization vector.
     */
    encrypt(plainText: string): EncryptedData {
        const iv = crypto.randomBytes(12);
        const cipher = crypto.createCipheriv('aes-256-gcm', this.primaryKey, iv);

        let ciphertext = cipher.update(plainText, 'utf8', 'hex');
        ciphertext += cipher.final('hex');

        const tag = cipher.getAuthTag().toString('hex');

        return {
            ciphertext,
            iv: iv.toString('hex'),
            tag,
            keyVersion: this.currentVersion,
        };
    }

    /**
     * Decrypts ciphertext and verifies GCM authentication tag.
     */
    decrypt(ciphertext: string, ivHex: string, tagHex: string, _keyVersion?: number): string {
        const iv = Buffer.from(ivHex, 'hex');
        const tag = Buffer.from(tagHex, 'hex');

        const decipher = crypto.createDecipheriv('aes-256-gcm', this.primaryKey, iv);
        decipher.setAuthTag(tag);

        let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }
}
