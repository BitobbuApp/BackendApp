import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListExchangeRatesUseCase } from '../../application/adminListExchangeRatesUseCase';
import { AdminUpsertExchangeRateUseCase } from '../../application/adminUpsertExchangeRateUseCase';

export async function adminExchangeRateRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: { from_currency?: string; to_currency?: string; effective_date?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminListExchangeRatesUseCase();
        const result = await useCase.execute(request.query);
        return ApiResponse.success(reply, result, "Exchange rates retrieved successfully");
    });

    app.post('/', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpsertExchangeRateUseCase();
        const result = await useCase.execute({ data: request.body });
        return ApiResponse.success(reply, result, "Exchange rate created successfully", 201);
    });

    app.patch('/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpsertExchangeRateUseCase();
        const result = await useCase.execute({ id: request.params.id, data: request.body });
        return ApiResponse.success(reply, result, "Exchange rate updated successfully");
    });
}
