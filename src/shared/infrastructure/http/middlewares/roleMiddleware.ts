import { FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../responseFormatter';

/**
 * Role guard: only companies with can_buy = true may proceed.
 * Used on endpoints that create or manage RFQs (buyer actions).
 */
export const requireBuyer = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.can_buy) {
        return ApiResponse.error(
            reply,
            "Access denied. Only buyer companies can perform this action.",
            403,
            undefined,
            "FORBIDDEN",
            "AUTHORIZATION"
        );
    }
};

/**
 * Role guard: only companies with can_sell = true may proceed.
 * Used on endpoints that create or manage quote responses (supplier actions).
 */
export const requireSeller = async (request: FastifyRequest, reply: FastifyReply) => {
    if (!request.user?.can_sell) {
        return ApiResponse.error(
            reply,
            "Access denied. Only supplier companies can perform this action.",
            403,
            undefined,
            "FORBIDDEN",
            "AUTHORIZATION"
        );
    }
};
