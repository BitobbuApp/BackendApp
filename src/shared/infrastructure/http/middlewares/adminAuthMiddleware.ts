import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtService } from '../../../application/services/jwtService';
import { ApiResponse } from '../responseFormatter';
import logger from '../../logger';
import { PrismaClient } from '@prisma/client';
import { ApplicationError } from '../../../domain/error';

const jwtService = new JwtService();
const prisma = new PrismaClient();

declare module 'fastify' {
    interface FastifyRequest {
        admin?: {
            adminId: string;
            email: string;
            role: string;
        }
    }
}

export const adminAuthMiddleware = async (request: FastifyRequest, reply: FastifyReply) => {
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

        if (decoded.actorType !== 'admin' || !decoded.adminId) {
            return ApiResponse.error(reply, "Unauthorized access", 403, undefined, "AUTHORIZATION_ERROR", "AUTHORIZATION");
        }

        const admin = await prisma.admin.findUnique({
            where: { id: decoded.adminId }
        });

        if (!admin || admin.status !== 'active') {
            return ApiResponse.error(reply, "Admin inactive or locked", 403, undefined, "AUTHORIZATION_ERROR", "AUTHORIZATION");
        }

        request.admin = {
            adminId: admin.id,
            email: admin.email,
            role: admin.role
        };
    } catch (error) {
        logger.error(error, 'Admin Auth Error');
        return ApiResponse.error(reply, "Internal authentication error", 500, undefined, "INTERNAL_SERVER_ERROR", "INTERNAL");
    }
};
