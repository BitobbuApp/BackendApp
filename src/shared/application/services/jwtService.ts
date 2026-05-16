import jwt from 'jsonwebtoken';

export interface TokenUserPayload {
    userId?: string;
    companyId?: string | null;
    email: string;

    actorType?: 'user' | 'admin';
    adminId?: string;
    role?: string;
    status?: string;
}

export class JwtService {
    private readonly secret: string;

    constructor() {
        this.secret = process.env.JWT_SECRET || 'fallback_secret';
    }

    generateToken(payload: TokenUserPayload): string {
        return jwt.sign(payload, this.secret, { expiresIn: '1h' });
    }

    verifyToken(token: string): TokenUserPayload | null {
        try {
            return jwt.verify(token, this.secret) as TokenUserPayload;
        } catch (error) {
            return null;
        }
    }
}
