import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtService } from '../../../application/services/jwtService';
import { ApiResponse } from '../responseFormatter';

const jwtService = new JwtService();

declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            userId: string;
            email: string;
        }
    }
}

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponse.error(reply, "Authentication token missing or invalid", 401);
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return ApiResponse.error(reply, "Authentication token missing", 401);
        }

        const decoded = jwtService.verifyToken(token);

        if (!decoded) {
            return ApiResponse.error(reply, "Invalid or expired token", 401);
        }

        request.user = decoded;
    } catch (error) {
        console.error('Auth Error:', error);
        return ApiResponse.error(reply, "Internal authentication error", 500);
    }
};
