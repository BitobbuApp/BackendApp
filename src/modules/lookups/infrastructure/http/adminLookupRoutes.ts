import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListLookupsUseCase } from '../../application/adminListLookupsUseCase';
import { AdminCreateLookupUseCase } from '../../application/adminCreateLookupUseCase';
import { AdminUpdateLookupUseCase } from '../../application/adminUpdateLookupUseCase';
import { AdminUpdateLookupStatusUseCase } from '../../application/adminUpdateLookupStatusUseCase';
import { AdminLookupTableKey } from '../../domain/entities/adminLookupItem.entity';

export async function adminLookupRoutes(app: FastifyInstance) {
    app.get('/:tableKey', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Params: { tableKey: string } }>, reply: FastifyReply) => {
        const useCase = new AdminListLookupsUseCase();
        const data = await useCase.execute({ tableKey: request.params.tableKey as AdminLookupTableKey });
        return ApiResponse.success(reply, data, `Lookups for ${request.params.tableKey} retrieved successfully`);
    });

    app.post('/:tableKey', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { tableKey: string }, Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminCreateLookupUseCase();
        const data = await useCase.execute({
            tableKey: request.params.tableKey as AdminLookupTableKey,
            data: request.body,
        });
        return ApiResponse.success(reply, data, `Lookup item created in ${request.params.tableKey} successfully`, 201);
    });

    app.patch('/:tableKey/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { tableKey: string, id: string }, Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpdateLookupUseCase();
        const data = await useCase.execute({
            tableKey: request.params.tableKey as AdminLookupTableKey,
            id: request.params.id,
            data: request.body,
        });
        return ApiResponse.success(reply, data, `Lookup item updated in ${request.params.tableKey} successfully`);
    });

    app.patch('/:tableKey/:id/status', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { tableKey: string, id: string }, Body: { is_active?: boolean, status?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminUpdateLookupStatusUseCase();
        const isActive = request.body.is_active ?? request.body.status === 'active';
        const data = await useCase.execute({
            tableKey: request.params.tableKey as AdminLookupTableKey,
            id: request.params.id,
            is_active: isActive,
        });
        return ApiResponse.success(reply, data, `Lookup item status updated in ${request.params.tableKey} successfully`);
    });
}
