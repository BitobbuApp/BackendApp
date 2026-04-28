import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { AdminListRfqsUseCase } from '../../application/adminListRfqsUseCase';

interface AdminRfqQuery {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    company_id?: string;
    category_id?: string;
}

export async function adminRfqRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: AdminRfqQuery }>, reply: FastifyReply) => {
        const useCase = new AdminListRfqsUseCase();
        const result = await useCase.execute({
            page: request.query.page ? Number(request.query.page) : 1,
            limit: request.query.limit ? Number(request.query.limit) : 10,
            search: request.query.search,
            status: request.query.status,
            company_id: request.query.company_id,
            category_id: request.query.category_id ? Number(request.query.category_id) : undefined
        });
        return ApiResponse.success(reply, result, "RFQs retrieved successfully");
    });
}
