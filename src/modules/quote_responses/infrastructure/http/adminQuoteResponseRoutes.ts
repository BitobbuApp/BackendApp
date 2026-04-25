import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';

export async function adminQuoteResponseRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        // Mock data for MVP
        const data = [
            {
                id: "qr-1",
                rfq_id: "rfq-1",
                supplier_company: "Proveedor",
                price_usd: 120.5,
                quantity: 50,
                status: "negotiating",
                created_at: "2026-04-01T00:00:00.000Z"
            }
        ];
        return ApiResponse.success(reply, data, "Quote responses retrieved successfully");
    });
}
