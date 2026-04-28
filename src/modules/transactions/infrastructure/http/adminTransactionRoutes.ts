import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { AdminListTransactionsUseCase } from '../../application/adminListTransactionsUseCase';

interface AdminTransactionQuery {
    page?: string;
    limit?: string;
    status?: string;
    buyer_id?: string;
    supplier_id?: string;
    search?: string;
}

export async function adminTransactionRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: AdminTransactionQuery }>, reply: FastifyReply) => {
        const useCase = new AdminListTransactionsUseCase();
        const result = await useCase.execute({
            page: request.query.page ? Number(request.query.page) : 1,
            limit: request.query.limit ? Number(request.query.limit) : 10,
            status: request.query.status,
            buyer_id: request.query.buyer_id,
            supplier_id: request.query.supplier_id,
            search: request.query.search
        });
        return ApiResponse.success(reply, result, "Transactions retrieved successfully");
    });
}
