import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListSubscriptionsUseCase } from '../../application/adminListSubscriptionsUseCase';

interface AdminSubscriptionQuery {
    page?: string;
    limit?: string;
    status?: string;
    company_id?: string;
}

export async function adminSubscriptionRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: AdminSubscriptionQuery }>, reply: FastifyReply) => {
        const useCase = new AdminListSubscriptionsUseCase();
        const result = await useCase.execute({
            page: request.query.page ? Number(request.query.page) : 1,
            limit: request.query.limit ? Number(request.query.limit) : 10,
            status: request.query.status,
            company_id: request.query.company_id
        });
        return ApiResponse.success(reply, result, "Subscriptions retrieved successfully");
    });

    app.patch('/:companyId/plan', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin'])] as any }, async (request: FastifyRequest<{ Params: { companyId: string }, Body: { plan_code: string, reason: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { company_id: request.params.companyId, plan_code: request.body.plan_code }, "Subscription plan updated successfully");
    });

    app.patch('/:companyId/extend-days', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin'])] as any }, async (request: FastifyRequest<{ Params: { companyId: string }, Body: { days: number, reason: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { company_id: request.params.companyId, days_extended: request.body.days }, "Subscription days extended successfully");
    });
}
