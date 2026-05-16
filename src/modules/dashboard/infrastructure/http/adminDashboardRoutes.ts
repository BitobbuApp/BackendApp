import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { AdminGetDashboardKpisUseCase } from '../../application/adminGetDashboardKpisUseCase';

export async function adminDashboardRoutes(app: FastifyInstance) {
    app.get('/kpis', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new AdminGetDashboardKpisUseCase();
        const result = await useCase.execute({});
        return ApiResponse.success(reply, result, "KPIs retrieved successfully");
    });
}
