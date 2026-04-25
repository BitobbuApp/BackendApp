import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';

export async function adminLookupRoutes(app: FastifyInstance) {
    app.get('/:tableKey', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Params: { tableKey: string } }>, reply: FastifyReply) => {
        // Mock data for MVP
        const data = [
            { id: "id1", code: "code1", label: "Label 1", is_active: true }
        ];
        return ApiResponse.success(reply, data, `Lookups for ${request.params.tableKey} retrieved successfully`);
    });

    app.post('/:tableKey', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { tableKey: string }, Body: any }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: "new-id", ...(request.body as object) }, `Lookup item created in ${request.params.tableKey} successfully`, 201);
    });

    app.patch('/:tableKey/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { tableKey: string, id: string }, Body: any }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: request.params.id, ...(request.body as object) }, `Lookup item updated in ${request.params.tableKey} successfully`);
    });

    app.patch('/:tableKey/:id/status', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { tableKey: string, id: string }, Body: { status: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: request.params.id, status: request.body.status }, `Lookup item status updated in ${request.params.tableKey} successfully`);
    });
}
