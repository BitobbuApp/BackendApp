import { FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../responseFormatter';

export const adminScopeMiddleware = (allowedRoles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const admin = request.admin;

            if (!admin) {
                return ApiResponse.error(reply, "Authentication required", 401, undefined, "AUTH_MISSING_TOKEN", "AUTHENTICATION");
            }

            if (!allowedRoles.includes(admin.role)) {
                return ApiResponse.error(reply, "Insufficient permissions", 403, undefined, "AUTHORIZATION_ERROR", "AUTHORIZATION");
            }
        } catch (error) {
            return ApiResponse.error(reply, "Internal authorization error", 500, undefined, "INTERNAL_SERVER_ERROR", "INTERNAL");
        }
    };
};
