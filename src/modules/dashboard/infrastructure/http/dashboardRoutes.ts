import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { GetDashboardStatsUseCase } from '../../application/GetDashboardStatsUseCase';

export async function dashboardRoutes(app: FastifyInstance) {
    app.get('/stats', 
        { preHandler: [authMiddleware] } as any, 
        async (request: any, reply: FastifyReply) => {
            const useCase = new GetDashboardStatsUseCase();
            const companyId = request.user.companyId;

            if (!companyId) {
                return ApiResponse.error(reply, "Company ID not found in session", 403);
            }

            const result = await useCase.execute({ company_id: companyId });
            return ApiResponse.success(reply, result, "Dashboard statistics retrieved successfully");
        }
    );
}
