import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { multipartParserMiddleware } from '../../../../shared/infrastructure/http/middlewares/multipartMiddleware';
import { GetTransactionByIdUseCase } from '../../application/getTransactionByIdUseCase';
import { ListTransactionsByCompanyUseCase } from '../../application/listTransactionsByCompanyUseCase';
import { listTransactionsQuerySchema } from '../../application/dtos/transaction.dto';
import { PerformTransactionActionUseCase } from '../../application/performTransactionActionUseCase';

// Transactions are created only by the quote state machine (AcceptedStrategy) and change state only
// through POST /:id/action. There are intentionally no create/update/delete endpoints.
export async function transactionRoutes(app: FastifyInstance) {

    // GET /transactions (List paginated transactions for the logged-in company)
    app.get('/',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            // Validate query params first
            const { error, value: query } = listTransactionsQuerySchema.validate(request.query);
            if (error) {
                return ApiResponse.error(reply, error.message, 400);
            }

            const useCase = new ListTransactionsByCompanyUseCase();
            // Assuming `request.user.companyId` is populated by authMiddleware
            const companyId = request.user.companyId;

            if (!companyId) {
                return ApiResponse.error(reply, "User company ID not found in token", 403);
            }

            const result = await useCase.execute({
                company_id: companyId,
                page: query.page,
                limit: query.limit
            });

            return ApiResponse.success(reply, result, "Transactions retrieved successfully");
        }
    );

    // GET /transactions/:id
    app.get('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            if (!request.user.companyId) {
                return ApiResponse.error(reply, "User company ID not found in token", 403);
            }
            const useCase = new GetTransactionByIdUseCase();
            const result = await useCase.execute({
                id: request.params.id,
                requester_company_id: request.user.companyId
            });
            return ApiResponse.success(reply, result, "Transaction found");
        }
    );

    // POST /transactions/:id/action (JWT protected — State Machine entry point)
    app.post('/:id/action',
        { preHandler: [authMiddleware, multipartParserMiddleware] } as any,
        async (request: any, reply: any) => {
            const { action, payload } = request.body;
            const useCase = new PerformTransactionActionUseCase();
            const result = await useCase.execute({
                transactionId: request.params.id,
                action,
                actorCompanyId: request.user.companyId,
                payload: payload || {},
                rawFiles: request.uploadedFiles || [],
            });
            return ApiResponse.success(reply, result, `Transaction action "${action}" performed successfully`);
        }
    );
}
