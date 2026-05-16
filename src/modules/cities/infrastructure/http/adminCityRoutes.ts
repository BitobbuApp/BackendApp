import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListCitiesUseCase } from '../../application/adminListCitiesUseCase';
import { AdminUpsertCityUseCase } from '../../application/adminUpsertCityUseCase';

export async function adminCityRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: { state_id?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminListCitiesUseCase();
        const stateId = request.query.state_id ? Number(request.query.state_id) : undefined;
        const result = await useCase.execute({ state_id: stateId });
        return ApiResponse.success(reply, result, "Cities retrieved successfully");
    });

    app.post('/', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpsertCityUseCase();
        const result = await useCase.execute({ data: request.body });
        return ApiResponse.success(reply, result, "City created successfully", 201);
    });

    app.patch('/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpsertCityUseCase();
        const result = await useCase.execute({ id: Number(request.params.id), data: request.body });
        return ApiResponse.success(reply, result, "City updated successfully");
    });
}
