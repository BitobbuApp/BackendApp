import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListPlansUseCase } from '../../application/adminListPlansUseCase';

export async function adminPlanRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: { is_active?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminListPlansUseCase();
        const result = await useCase.execute({
            is_active: request.query.is_active === 'true' ? true : (request.query.is_active === 'false' ? false : undefined)
        });
        return ApiResponse.success(reply, result, "Plans retrieved successfully");
    });

    app.post('/', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: "new-uuid", ...(request.body as object) }, "Plan created successfully", 201);
    });

    app.patch('/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: request.params.id, ...(request.body as object) }, "Plan updated successfully");
    });

    app.patch('/:id/status', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: string }, Body: { status: string, reason: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: request.params.id, status: request.body.status }, "Plan status updated successfully");
    });
}
