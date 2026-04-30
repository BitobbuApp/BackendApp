import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';

export async function adminUserRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        // Mock data for MVP
        const data = {
            items: [
                {
                    id: "uuid",
                    company_name: "Acme",
                    trade_name: "Acme",
                    email: "ops@acme.com",
                    profile_type: "buyer",
                    registration_date: "2026-04-01T00:00:00.000Z",
                    status: "active"
                }
            ],
            page: 1,
            limit: 10,
            total: 250,
            total_pages: 25
        };
        return ApiResponse.success(reply, data, "Users retrieved successfully");
    });

    app.get('/:id', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const data = {
            id: request.params.id,
            company_name: "Acme",
            trade_name: "Acme",
            email: "ops@acme.com",
            profile_type: "buyer",
            registration_date: "2026-04-01T00:00:00.000Z",
            status: "active",
            contacts: [],
            locations: [],
            payment_preferences: []
        };
        return ApiResponse.success(reply, data, "User details retrieved successfully");
    });

    app.patch('/:id/status', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'ops_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: string }, Body: { status: string, reason: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: request.params.id, status: request.body.status }, "User status updated successfully");
    });
}
