import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { CreateRequestUseCase } from '../../application/createRequestUseCase';
import { GetRequestByIdUseCase } from '../../application/getRequestByIdUseCase';
import { GetRequestsByCompanyIdUseCase } from '../../application/getRequestsByCompanyIdUseCase';
import { UpdateRequestUseCase } from '../../application/updateRequestUseCase';
import { DeleteRequestUseCase } from '../../application/deleteRequestUseCase';
import { ListMarketplaceRequestsUseCase } from '../../application/listMarketplaceRequestsUseCase';

import { multipartParserMiddleware } from '../../../../shared/infrastructure/http/middlewares/multipartMiddleware';

export async function requestRoutes(app: FastifyInstance) {

    // GET /requests/marketplace (JWT protected — lists requests from OTHER companies)
    app.get('/marketplace',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const query = request.query || {};
            const useCase = new ListMarketplaceRequestsUseCase();
            const result = await useCase.execute({
                exclude_company_id: request.user.companyId,
                page: query.page ? parseInt(query.page, 10) : 1,
                limit: query.limit ? parseInt(query.limit, 10) : 10
            });
            return ApiResponse.success(reply, result, "Marketplace requests found");
        }
    );

    // POST /requests (JWT protected)
    app.post('/',
        { preHandler: [authMiddleware, multipartParserMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new CreateRequestUseCase();
            const result = await useCase.execute({
                ...request.body,
                rawFiles: request.uploadedFiles || [],
                company_id: request.user.companyId,
                user_id: request.user.userId
            });
            return ApiResponse.success(reply, result, "Request created", 201);
        }
    );

    // GET /requests/company/:companyId (JWT protected, requires user to belong to company?)
    // Actually the prompt says "add a functionality to list the Request for a compnay with pagiantion to, that will be important"
    app.get('/company',
        { preHandler: [authMiddleware] } as any,
        async (
            request: FastifyRequest<{ Querystring: { page?: string, limit?: string } }>,
            reply: FastifyReply
        ) => {
            const useCase = new GetRequestsByCompanyIdUseCase();
            console.log({
                company_id: request.user?.companyId,
                page: request.query.page ? parseInt(request.query.page, 10) : 1,
                limit: request.query.limit ? parseInt(request.query.limit, 10) : 10
            })
            const result = await useCase.execute({
                company_id: request.user?.companyId,
                page: request.query.page ? parseInt(request.query.page, 10) : 1,
                limit: request.query.limit ? parseInt(request.query.limit, 10) : 10
            });
            return ApiResponse.success(reply, result, "Requests found");
        }
    );

    // GET /requests/:id (JWT protected)
    app.get('/info/:id',
        { preHandler: [authMiddleware] } as any,
        async (
            request: FastifyRequest<{ Params: { id: string } }>,
            reply: FastifyReply
        ) => {
            const useCase = new GetRequestByIdUseCase();
            const result = await useCase.execute(request.params.id);
            return ApiResponse.success(reply, result, "Request found");
        }
    );

    // PATCH /requests/:id (JWT protected)
    app.patch('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new UpdateRequestUseCase();
            const result = await useCase.execute({
                ...request.body,
                id: request.params.id
            });
            return ApiResponse.success(reply, result, "Request updated");
        }
    );

    // DELETE /requests/:id (JWT protected)
    app.delete('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new DeleteRequestUseCase();
            await useCase.execute(request.params.id);
            return ApiResponse.success(reply, null, "Request removed");
        }
    );
}
