import { FastifyInstance } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { SubmitBuyerReviewUseCase } from '../../application/submitBuyerReviewUseCase';
import { SubmitSellerReviewUseCase } from '../../application/submitSellerReviewUseCase';

export async function reviewRoutes(app: FastifyInstance) {
    /**
     * POST /reviews/:transactionId/evaluate-supplier
     * Called by the BUYER to submit their review of the SUPPLIER.
     */
    app.post('/:transactionId/evaluate-supplier',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new SubmitBuyerReviewUseCase();
            const result = await useCase.execute({
                transactionId: request.params.transactionId,
                actorCompanyId: request.user.companyId,
                ...request.body,
            });
            return ApiResponse.success(reply, result, 'Buyer review submitted successfully');
        }
    );

    /**
     * POST /reviews/:transactionId/evaluate-buyer
     * Called by the SUPPLIER to submit their review of the BUYER.
     */
    app.post('/:transactionId/evaluate-buyer',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new SubmitSellerReviewUseCase();
            const result = await useCase.execute({
                transactionId: request.params.transactionId,
                actorCompanyId: request.user.companyId,
                ...request.body,
            });
            return ApiResponse.success(reply, result, 'Seller review submitted successfully');
        }
    );
}
