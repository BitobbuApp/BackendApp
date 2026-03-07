import jwt from 'jsonwebtoken';

export interface TokenPayload {
    userId: string;
    email: string;
}

export class JwtService {
    private readonly secret: string;

    constructor() {
        this.secret = process.env.JWT_SECRET || 'fallback_secret';
    }

    generateToken(payload: TokenPayload): string {
        return jwt.sign(payload, this.secret, { expiresIn: '1h' });
    }

    verifyToken(token: string): TokenPayload | null {
        try {
            return jwt.verify(token, this.secret) as TokenPayload;
        } catch (error) {
            return null;
        }
    }
}
