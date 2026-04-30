import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';

export async function adminSubscriptionRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        // Mock data for MVP
        const data = [
            {
                company_id: "uuid",
                company_name: "Empresa",
                plan_tier: "Growth",
                activation_date: "2026-01-01",
                expiration_date: "2026-07-01",
                status: "active"
            }
        ];
        return ApiResponse.success(reply, data, "Subscriptions retrieved successfully");
    });

    app.patch('/:companyId/plan', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin'])] as any }, async (request: FastifyRequest<{ Params: { companyId: string }, Body: { plan_code: string, reason: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { company_id: request.params.companyId, plan_code: request.body.plan_code }, "Subscription plan updated successfully");
    });

    app.patch('/:companyId/extend-days', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin'])] as any }, async (request: FastifyRequest<{ Params: { companyId: string }, Body: { days: number, reason: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { company_id: request.params.companyId, days_extended: request.body.days }, "Subscription days extended successfully");
    });
}
