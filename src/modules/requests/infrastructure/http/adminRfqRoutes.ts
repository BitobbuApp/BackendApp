import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';

export async function adminRfqRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        // Mock data for MVP
        const data = [
            {
                id: "rfq-1",
                product_service: "Producto",
                buyer_company: "Comprador",
                quantity: 100,
                unit: "kg",
                status: "open",
                created_at: "2026-04-01T00:00:00.000Z"
            }
        ];
        return ApiResponse.success(reply, data, "RFQs retrieved successfully");
    });
}
