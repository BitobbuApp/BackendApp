import crypto from 'crypto';

export interface GeneratedToken {
    token: string;
    tokenHash: string;
}

export class TokenGenerator {
    /**
     * Generates a cryptographically strong 32-byte opaque token encoded in base64url,
     * along with its deterministic SHA-256 hex digest for secure storage.
     */
    static generateOpaqueToken(): GeneratedToken {
        const rawBytes = crypto.randomBytes(32);
        const token = rawBytes.toString('base64url');
        const tokenHash = this.hashToken(token);

        return { token, tokenHash };
    }

    /**
     * Hashes an opaque token using SHA-256.
     */
    static hashToken(token: string): string {
        return crypto.createHash('sha256').update(token.trim()).digest('hex');
    }
}
