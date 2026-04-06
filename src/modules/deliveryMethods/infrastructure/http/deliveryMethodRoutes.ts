import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { ListDeliveryMethodsUseCase } from '../../application/listDeliveryMethodsUseCase';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';

export async function deliveryMethodRoutes(app: FastifyInstance) {
    app.get('/:country_id', { preHandler: [authMiddleware] } as any, async (request: FastifyRequest<{ Params: { country_id: string } }>, reply: FastifyReply) => {
        const useCase = new ListDeliveryMethodsUseCase();
        const countryId = parseInt(request.params.country_id, 10);
        const result = await useCase.execute(countryId);
        return ApiResponse.success(reply, result, "Delivery methods retrieved successfully");
    });
}
