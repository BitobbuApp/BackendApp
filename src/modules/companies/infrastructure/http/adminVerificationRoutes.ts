import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';

export async function adminVerificationRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        // Mock data for MVP
        const data = [
            {
                id: "ver-001",
                company_id: "uuid",
                company_name: "Proveedor",
                tax_id: "J-123",
                representative: "Nombre",
                primary_contact: "email@x.com",
                submitted_at: "2026-04-20T00:00:00.000Z",
                document_url: "https://...",
                status: "pending"
            }
        ];
        return ApiResponse.success(reply, data, "Verifications retrieved successfully");
    });

    app.get('/:id', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const data = {
            id: request.params.id,
            company_id: "uuid",
            company_name: "Proveedor",
            tax_id: "J-123",
            representative: "Nombre",
            primary_contact: "email@x.com",
            submitted_at: "2026-04-20T00:00:00.000Z",
            document_url: "https://...",
            status: "pending"
        };
        return ApiResponse.success(reply, data, "Verification details retrieved successfully");
    });

    app.patch('/:id/approve', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'ops_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: request.params.id, status: "approved" }, "Verification approved successfully");
    });

    app.patch('/:id/reject', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'ops_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: string }, Body: { reason: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, { id: request.params.id, status: "rejected", reason: request.body.reason }, "Verification rejected successfully");
    });
}
