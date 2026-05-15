import { FastifyRequest, FastifyReply } from 'fastify';
import { JwtService } from '../../../application/services/jwtService';
import { ApiResponse } from '../responseFormatter';
import logger from '../../logger';
import { GetUserByIdEmailUseCase } from '../../../../modules/users/application/getUserByIdEmailUseCase';
import { GetCompanyByIdUseCase } from '../../../../modules/companies/application/getCompanyByIdUseCase';

const jwtService = new JwtService();
const getUserByIdEmail = new GetUserByIdEmailUseCase();
const getCompanyById = new GetCompanyByIdUseCase();

declare module 'fastify' {
    interface FastifyRequest {
        user?: {
            userId?: string;
            companyId?: string | null;
            email: string;
            can_buy?: boolean;
            can_sell?: boolean;
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

        if (!decoded || !decoded.userId || !decoded.email) {
            return ApiResponse.error(reply, "Invalid or expired token", 401, undefined, "AUTH_INVALID_TOKEN", "AUTHENTICATION");
        }

        // 1. Validate token payload against the database (userId + email match + is_active)
        const validUser = await getUserByIdEmail.execute({
            userId: decoded.userId,
            email: decoded.email,
        });

        request.user = {
            userId: validUser.userId,
            companyId: validUser.companyId,
            email: validUser.email,
        };

        // 2. If the user has a company, enrich request.user with can_buy / can_sell
        if (validUser.companyId) {
            const company = await getCompanyById.execute(validUser.companyId);
            request.user.can_buy = company.can_buy ?? false;
            request.user.can_sell = company.can_sell ?? false;
        }

    } catch (error: any) {
        // ApplicationError from the use cases (401 inactive/not found/mismatch)
        if (error?.statusCode === 401) {
            return ApiResponse.error(reply, error.message, 401, undefined, "AUTH_INVALID_TOKEN", "AUTHENTICATION");
        }
        logger.error(error, 'Auth Error');
        return ApiResponse.error(reply, "Internal authentication error", 500, undefined, "INTERNAL_SERVER_ERROR", "INTERNAL");
    }
};
