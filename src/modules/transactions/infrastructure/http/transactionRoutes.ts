import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { CreateTransactionUseCase } from '../../application/createTransactionUseCase';
import { GetTransactionByIdUseCase } from '../../application/getTransactionByIdUseCase';
import { UpdateTransactionUseCase } from '../../application/updateTransactionUseCase';
import { DeleteTransactionUseCase } from '../../application/deleteTransactionUseCase';
import { ListTransactionsByCompanyUseCase } from '../../application/listTransactionsByCompanyUseCase';
import { listTransactionsQuerySchema } from '../../application/dtos/transaction.dto';

export async function transactionRoutes(app: FastifyInstance) {

    // POST /transactions
    app.post('/',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new CreateTransactionUseCase();
            // Assign buyer or supplier from JWT payload if appropriate based on context
            // But for now, we pass the body assuming it contains proper IDs
            const result = await useCase.execute(request.body);
            return ApiResponse.success(reply, result, "Transaction created", 201);
        }
    );

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
            const useCase = new GetTransactionByIdUseCase();
            const result = await useCase.execute(request.params.id);
            return ApiResponse.success(reply, result, "Transaction found");
        }
    );

    // PATCH /transactions/:id
    app.patch('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new UpdateTransactionUseCase();
            const result = await useCase.execute({
                ...request.body,
                id: request.params.id
            });
            return ApiResponse.success(reply, result, "Transaction updated");
        }
    );

    // DELETE /transactions/:id
    app.delete('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new DeleteTransactionUseCase();
            const result = await useCase.execute(request.params.id);
            return ApiResponse.success(reply, result, "Transaction removed");
        }
    );
}
