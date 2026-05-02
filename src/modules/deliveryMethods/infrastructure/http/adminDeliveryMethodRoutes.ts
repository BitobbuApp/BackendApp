import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListDeliveryMethodsUseCase } from '../../application/adminListDeliveryMethodsUseCase';
import { AdminUpsertDeliveryMethodUseCase } from '../../application/adminUpsertDeliveryMethodUseCase';
import { AdminUpdateDeliveryMethodStatusUseCase } from '../../application/adminUpdateDeliveryMethodStatusUseCase';

export async function adminDeliveryMethodRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: { country_id?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminListDeliveryMethodsUseCase();
        const countryId = request.query.country_id ? Number(request.query.country_id) : undefined;
        const result = await useCase.execute({ country_id: countryId });
        return ApiResponse.success(reply, result, "Delivery methods retrieved successfully");
    });

    app.post('/', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpsertDeliveryMethodUseCase();
        const result = await useCase.execute({ data: request.body });
        return ApiResponse.success(reply, result, "Delivery method created successfully", 201);
    });

    app.patch('/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: string }; Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpsertDeliveryMethodUseCase();
        const result = await useCase.execute({ id: request.params.id, data: request.body });
        return ApiResponse.success(reply, result, "Delivery method updated successfully");
    });

    app.patch('/:id/status', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: string }; Body: { is_active?: boolean; status?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminUpdateDeliveryMethodStatusUseCase();
        const isActive = request.body.is_active ?? request.body.status === 'active';
        const result = await useCase.execute({ id: request.params.id, is_active: isActive });
        return ApiResponse.success(reply, result, "Delivery method status updated successfully");
    });
}
