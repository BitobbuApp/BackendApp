import jwt from 'jsonwebtoken';

export interface TokenUserPayload {
    userId?: string;
    companyId?: string | null;
    email: string;

    actorType?: 'user' | 'admin';
    adminId?: string;
    role?: string;
    status?: string;

    tv?: number;
    purpose?: string;
}

export class JwtService {
    private readonly secret: string;

    constructor() {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            // Only an explicit NODE_ENV=test (set by jest and scripts/run-node-tests.mjs) may use the fixed secret
            if (process.env.NODE_ENV === 'test') {
                this.secret = 'test_secret_for_automated_testing_purposes_only_32bytes';
            } else {
                throw new Error('JWT_SECRET environment variable is required and cannot be empty.');
            }
        } else {
            this.secret = secret;
        }
    }

    generateToken(payload: TokenUserPayload, expiresIn: string = '1h'): string {
        return jwt.sign(payload, this.secret, { expiresIn } as any);
    }

    verifyToken(token: string): TokenUserPayload | null {
        try {
            return jwt.verify(token, this.secret) as TokenUserPayload;
        } catch (error) {
            return null;
        }
    }

    /**
     * Generates a short-lived step token (e.g., mfa verification or mfa enrollment)
     * with an explicit purpose claim.
     */
    generateStepToken(payload: { userId: string; email: string; purpose: 'mfa' | 'mfa_enroll' }, expiresIn: string = '5m'): string {
        return jwt.sign(payload, this.secret, { expiresIn } as any);
    }

    /**
     * Verifies that a token has the exact expected purpose.
     */
    verifyStepToken(token: string, expectedPurpose: 'mfa' | 'mfa_enroll'): { userId: string; email: string; purpose: string } | null {
        try {
            const decoded = jwt.verify(token, this.secret) as any;
            if (decoded && decoded.purpose === expectedPurpose && decoded.userId && decoded.email) {
                return decoded;
            }
            return null;
        } catch (error) {
            return null;
        }
    }
}
