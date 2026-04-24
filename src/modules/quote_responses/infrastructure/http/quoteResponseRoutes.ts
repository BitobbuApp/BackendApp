import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { multipartParserMiddleware } from '../../../../shared/infrastructure/http/middlewares/multipartMiddleware';
import { CreateQuoteResponseUseCase } from '../../application/createQuoteResponseUseCase';
import { GetQuoteResponseByIdUseCase } from '../../application/getQuoteResponseByIdUseCase';
import { GetQuoteResponseWithSupplierUseCase } from '../../application/getQuoteResponseWithSupplierUseCase';
import { ListQuoteResponsesByCompanyUseCase } from '../../application/listQuoteResponsesByCompanyUseCase';
import { ListReceivedQuoteResponsesUseCase } from '../../application/listReceivedQuoteResponsesUseCase';
import { ListQuoteResponsesByRequestIdUseCase } from '../../application/listQuoteResponsesByRequestIdUseCase';
import { UpdateQuoteResponseUseCase } from '../../application/updateQuoteResponseUseCase';
import { DeleteQuoteResponseUseCase } from '../../application/deleteQuoteResponseUseCase';
import { PerformQuoteActionUseCase } from '../../application/performQuoteActionUseCase';

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

    // GET /quote-responses/received (JWT protected — offers others have made for MY requests)
    app.get('/received',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const { page, limit } = request.query as { page?: string, limit?: string };
            const useCase = new ListReceivedQuoteResponsesUseCase();
            const result = await useCase.execute({
                company_id: request.user.companyId,
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 10
            });
            return ApiResponse.success(reply, result, "Received quote responses retrieved");
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

    // GET /quote-responses/:id/with-supplier (JWT protected)
    app.get('/:id/with-supplier',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new GetQuoteResponseWithSupplierUseCase();
            const result = await useCase.execute(request.params.id);
            return ApiResponse.success(reply, result, "Quote response and supplier found");
        }
    );

    // GET /quote-responses/request/:requestId (JWT protected)
    app.get('/request/:requestId',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const { page, limit } = request.query as { page?: string, limit?: string };
            const useCase = new ListQuoteResponsesByRequestIdUseCase();
            const result = await useCase.execute({
                request_id: request.params.requestId,
                page: page ? parseInt(page, 10) : 1,
                limit: limit ? parseInt(limit, 10) : 10
            });
            return ApiResponse.success(reply, result, "Quote responses for request retrieved");
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

    // POST /quote-responses/:id/action (JWT protected — State Machine entry point)
    app.post('/:id/action',
        { preHandler: [authMiddleware, multipartParserMiddleware] } as any,
        async (request: any, reply: any) => {
            const { action, payload } = request.body;
            const useCase = new PerformQuoteActionUseCase();
            const result = await useCase.execute({
                quoteResponseId: request.params.id,
                action,
                actorCompanyId: request.user.companyId,
                payload: payload || {},
                rawFiles: request.uploadedFiles || [],
            });
            return ApiResponse.success(reply, result, `Action "${action}" performed successfully`);
        }
    );
}
