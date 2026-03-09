// src/modules/companyOffers/infrastructure/http/companyOfferRoutes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { CreateCompanyOfferUseCase } from '../../application/createCompanyOfferUseCase';
import { GetCompanyOfferByIdUseCase } from '../../application/getCompanyOfferByIdUseCase';
import { UpdateCompanyOfferUseCase } from '../../application/updateCompanyOfferUseCase';
import { DeleteCompanyOfferUseCase } from '../../application/deleteCompanyOfferUseCase';
import { ListCompanyOffersByCompanyUseCase } from '../../application/listCompanyOffersByCompanyUseCase';
import { ListCompanyOffersUseCase } from '../../application/listCompanyOffersUseCase';

export async function companyOfferRoutes(app: FastifyInstance) {

    // POST /company-offers (JWT protected)
    app.post('/',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new CreateCompanyOfferUseCase();
            // Assuming the JWT payload has user.company_id
            // We use the company_id from the body or fallback to user's company
            const company_id = request.body.company_id || request.user.companyId;
            const result = await useCase.execute({
                ...request.body,
                company_id: company_id
            });
            return ApiResponse.success(reply, result, "Company offer created", 201);
        }
    );

    // GET /company-offers (public or protected)
    app.get('/',
        async (request: FastifyRequest<{ Querystring: { page?: string, limit?: string } }>, reply: FastifyReply) => {
            const useCase = new ListCompanyOffersUseCase();
            const page = parseInt(request.query.page || '1', 10);
            const limit = parseInt(request.query.limit || '10', 10);
            const result = await useCase.execute({ page, limit });
            return ApiResponse.success(reply, result, "Company offers retrieved");
        }
    );

    // GET /company-offers/:id (public or protected)
    app.get('/:id',
        async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            const useCase = new GetCompanyOfferByIdUseCase();
            const result = await useCase.execute(request.params.id);
            return ApiResponse.success(reply, result, "Company offer found");
        }
    );

    // GET /company-offers/company/:companyId (public or protected)
    app.get('/company/:companyId',
        async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
            const useCase = new ListCompanyOffersByCompanyUseCase();
            const result = await useCase.execute(request.params.companyId);
            return ApiResponse.success(reply, result, "Company offers found");
        }
    );

    // PATCH /company-offers/:id (JWT protected)
    app.patch('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new UpdateCompanyOfferUseCase();
            const result = await useCase.execute({
                ...request.body,
                id: request.params.id
            });
            return ApiResponse.success(reply, result, "Company offer updated");
        }
    );

    // DELETE /company-offers/:id (JWT protected)
    app.delete('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new DeleteCompanyOfferUseCase();
            await useCase.execute(request.params.id);
            return ApiResponse.success(reply, null, "Company offer removed");
        }
    );
}
