import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListPlansUseCase } from '../../application/adminListPlansUseCase';
import { AdminCreatePlanUseCase } from '../../application/adminCreatePlanUseCase';
import { AdminUpdatePlanUseCase } from '../../application/adminUpdatePlanUseCase';

export async function adminPlanRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: { is_active?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminListPlansUseCase();
        const result = await useCase.execute({
            is_active: request.query.is_active === 'true' ? true : (request.query.is_active === 'false' ? false : undefined)
        });
        return ApiResponse.success(reply, result, "Plans retrieved successfully");
    });

    app.post('/', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminCreatePlanUseCase();
        const result = await useCase.execute(request.body);
        return ApiResponse.success(reply, result, "Plan created successfully", 201);
    });

    app.patch('/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpdatePlanUseCase();
        const result = await useCase.execute({ id: request.params.id, data: request.body });
        return ApiResponse.success(reply, result, "Plan updated successfully");
    });

    app.patch('/:id/status', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: string }, Body: { status: string, reason?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminUpdatePlanUseCase();
        const result = await useCase.execute({ 
            id: request.params.id, 
            data: { is_active: request.body.status === 'active' } 
        });
        return ApiResponse.success(reply, result, "Plan status updated successfully");
    });
}
