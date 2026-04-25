import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';

export async function adminDashboardRoutes(app: FastifyInstance) {
    app.get('/kpis', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        // Mock data for MVP
        const data = {
            total_users: 1248,
            rfqs_last_7_days: 186,
            quotes_last_7_days: 142,
            suppliers_pending_verification: 23
        };
        return ApiResponse.success(reply, data, "KPIs retrieved successfully");
    });
}
