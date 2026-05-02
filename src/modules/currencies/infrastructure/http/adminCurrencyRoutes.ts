import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListCurrenciesUseCase } from '../../application/adminListCurrenciesUseCase';
import { AdminUpsertCurrencyUseCase } from '../../application/adminUpsertCurrencyUseCase';
import { AdminUpdateCurrencyStatusUseCase } from '../../application/adminUpdateCurrencyStatusUseCase';

export async function adminCurrencyRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (_request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new AdminListCurrenciesUseCase();
        const result = await useCase.execute({});
        return ApiResponse.success(reply, result, "Currencies retrieved successfully");
    });

    app.post('/', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpsertCurrencyUseCase();
        const result = await useCase.execute({ data: request.body });
        return ApiResponse.success(reply, result, "Currency created successfully", 201);
    });

    app.patch('/:code', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { code: string }, Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpsertCurrencyUseCase();
        const result = await useCase.execute({ code: request.params.code, data: request.body });
        return ApiResponse.success(reply, result, "Currency updated successfully");
    });

    app.patch('/:code/status', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { code: string }, Body: { is_active?: boolean, status?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminUpdateCurrencyStatusUseCase();
        const isActive = request.body.is_active ?? request.body.status === 'active';
        const result = await useCase.execute({ code: request.params.code, is_active: isActive });
        return ApiResponse.success(reply, result, "Currency status updated successfully");
    });
}
