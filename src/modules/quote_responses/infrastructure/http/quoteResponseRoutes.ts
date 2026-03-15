import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { CreateQuoteResponseUseCase } from '../../application/createQuoteResponseUseCase';
import { GetQuoteResponseByIdUseCase } from '../../application/getQuoteResponseByIdUseCase';
import { ListQuoteResponsesByCompanyUseCase } from '../../application/listQuoteResponsesByCompanyUseCase';
import { UpdateQuoteResponseUseCase } from '../../application/updateQuoteResponseUseCase';
import { DeleteQuoteResponseUseCase } from '../../application/deleteQuoteResponseUseCase';

export async function quoteResponseRoutes(app: FastifyInstance) {

    // POST /quote-responses (JWT protected)
    app.post('/',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new CreateQuoteResponseUseCase();
            const result = await useCase.execute({
                ...request.body,
                supplier_id: request.user.companyId
            });
            return ApiResponse.success(reply, result, "Quote response created", 201);
        }
    );

    // GET /quote-responses/company (JWT protected)
    app.get('/company',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const { page, limit } = request.query as { page?: string, limit?: string };
            const useCase = new ListQuoteResponsesByCompanyUseCase();
            const result = await useCase.execute({
                supplier_id: request.user.companyId,
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 10
            });
            return ApiResponse.success(reply, result, "Quote responses list retrieved");
        }
    );

    // GET /quote-responses/:id (JWT protected)
    app.get('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new GetQuoteResponseByIdUseCase();
            const result = await useCase.execute(request.params.id);
            return ApiResponse.success(reply, result, "Quote response found");
        }
    );

    // PATCH /quote-responses/:id (JWT protected)
    app.patch('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new UpdateQuoteResponseUseCase();
            const result = await useCase.execute({
                ...request.body,
                id: request.params.id
            });
            return ApiResponse.success(reply, result, "Quote response updated");
        }
    );

    // DELETE /quote-responses/:id (JWT protected)
    app.delete('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new DeleteQuoteResponseUseCase();
            await useCase.execute(request.params.id);
            return ApiResponse.success(reply, null, "Quote response removed");
        }
    );
}
