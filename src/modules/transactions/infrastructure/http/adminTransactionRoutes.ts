import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';

export async function adminTransactionRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        // Mock data for MVP
        const data = [
            {
                id: "trx-1",
                buyer_company: "Comprador",
                supplier_company: "Proveedor",
                total_amount_usd: 500.0,
                currency: "USD",
                status: "awaiting_payment",
                created_at: "2026-04-01T00:00:00.000Z"
            }
        ];
        return ApiResponse.success(reply, data, "Transactions retrieved successfully");
    });
}
