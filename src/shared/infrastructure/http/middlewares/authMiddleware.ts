import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtService } from '../../../application/services/jwtService';
import { ApiResponse } from '../responseFormatter';
import logger from '../../logger';

const jwtService = new JwtService();

declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            userId: string;
            companyId: string | null;
            email: string;
        }
    }
}

export const authMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
    try {
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return ApiResponse.error(reply, "Authentication token missing or invalid", 401, undefined, "AUTH_MISSING_TOKEN", "AUTHENTICATION");
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return ApiResponse.error(reply, "Authentication token missing", 401, undefined, "AUTH_MISSING_TOKEN", "AUTHENTICATION");
        }

        const decoded = jwtService.verifyToken(token);

        if (!decoded) {
            return ApiResponse.error(reply, "Invalid or expired token", 401, undefined, "AUTH_INVALID_TOKEN", "AUTHENTICATION");
        }

        request.user = decoded;
    } catch (error) {
        logger.error(error, 'Auth Error');
        return ApiResponse.error(reply, "Internal authentication error", 500, undefined, "INTERNAL_SERVER_ERROR", "INTERNAL");
    }
};
