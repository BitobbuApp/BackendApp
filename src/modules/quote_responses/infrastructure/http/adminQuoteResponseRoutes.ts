import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { AdminListQuotesUseCase } from '../../application/adminListQuotesUseCase';

interface AdminQuoteQuery {
    page?: string;
    limit?: string;
    status?: string;
    request_id?: string;
    supplier_id?: string;
}

export async function adminQuoteResponseRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: AdminQuoteQuery }>, reply: FastifyReply) => {
        const useCase = new AdminListQuotesUseCase();
        const result = await useCase.execute({
            page: request.query.page ? Number(request.query.page) : 1,
            limit: request.query.limit ? Number(request.query.limit) : 10,
            status: request.query.status,
            request_id: request.query.request_id,
            supplier_id: request.query.supplier_id
        });
        return ApiResponse.success(reply, result, "Quote responses retrieved successfully");
    });
}
