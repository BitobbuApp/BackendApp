import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';

export async function adminGeographyRoutes(app: FastifyInstance) {
    app.get('/countries', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        // Mock data for MVP
        const data = [{ id: 1, name: "Country A", is_active: true }];
        return ApiResponse.success(reply, data, "Countries retrieved successfully");
    });

    app.post('/countries', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: 2, ...(request.body as object) }, "Country created successfully", 201);
    });

    app.patch('/countries/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: number }, Body: any }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: request.params.id, ...(request.body as object) }, "Country updated successfully");
    });

    app.patch('/countries/:id/status', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: number }, Body: { status: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: request.params.id, status: request.body.status }, "Country status updated successfully");
    });

    app.get('/states', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: { country_code: string } }>, reply: FastifyReply) => {
        const data = [{ id: 1, name: "State A", country_id: 1, is_active: true }];
        return ApiResponse.success(reply, data, "States retrieved successfully");
    });

    app.post('/states', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: 2, ...(request.body as object) }, "State created successfully", 201);
    });

    app.patch('/states/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: number }, Body: any }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: request.params.id, ...(request.body as object) }, "State updated successfully");
    });

    app.patch('/states/:id/status', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: number }, Body: { status: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: request.params.id, status: request.body.status }, "State status updated successfully");
    });
}
