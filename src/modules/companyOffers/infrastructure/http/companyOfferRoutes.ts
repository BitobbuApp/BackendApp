import { prisma } from '../../../../shared/infrastructure/database';
import { SubscriptionGuardService } from '../../../subscriptions/application/subscription-guard.service';
import { PrismaSubscriptionRepository } from '../../../subscriptions/infrastructure/persistence/PrismaSubscriptionRepository';
// src/modules/companyOffers/infrastructure/http/companyOfferRoutes.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { multipartParserMiddleware } from '../../../../shared/infrastructure/http/middlewares/multipartMiddleware';
import { CreateCompanyOfferUseCase } from '../../application/createCompanyOfferUseCase';
import { GetCompanyOfferByIdUseCase } from '../../application/getCompanyOfferByIdUseCase';
import { UpdateCompanyOfferUseCase } from '../../application/updateCompanyOfferUseCase';
import { DeleteCompanyOfferUseCase } from '../../application/deleteCompanyOfferUseCase';
import { ListCompanyOffersByCompanyUseCase } from '../../application/listCompanyOffersByCompanyUseCase';
import { ListCompanyOffersUseCase } from '../../application/listCompanyOffersUseCase';

export async function companyOfferRoutes(app: FastifyInstance) {

    // POST /company-offers (JWT protected)
    app.post('/',
        { preHandler: [authMiddleware, multipartParserMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new CreateCompanyOfferUseCase();
            // Assuming the JWT payload has user.company_id
            // We use the company_id from the body or fallback to user's company
            const company_id = request.body.company_id || request.user.companyId;
            //const guard = new SubscriptionGuardService(new PrismaSubscriptionRepository());
            //const activeOffersCount = await prisma.companyOffer.count({
            //    where: { company_id }
            //});
            //await guard.authorize(company_id, 'offer', activeOffersCount);
            // The multipart parser might leave pricing_tiers as a JSON string
            if (request.body.pricing_tiers && typeof request.body.pricing_tiers === 'string') {
                try {
                    request.body.pricing_tiers = JSON.parse(request.body.pricing_tiers);
                } catch (e) {
                    // Let Joi validation fail if it's invalid JSON
                }
            }

            const result = await useCase.execute({
                ...request.body,
                company_id: company_id,
                rawFiles: request.uploadedFiles || []
            });
            return ApiResponse.success(reply, result, "Company offer created", 201);
        }
    );

    // GET /company-offers (JWT protected)
    app.get('/',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new ListCompanyOffersUseCase();
            const page = parseInt(request.query.page || '1', 10);
            const limit = parseInt(request.query.limit || '10', 10);
            const result = await useCase.execute({ page, limit });
            return ApiResponse.success(reply, result, "Company offers retrieved");
        }
    );

    // GET /company-offers/:id (JWT protected)
    app.get('/:id',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new GetCompanyOfferByIdUseCase();
            const result = await useCase.execute(request.params.id);
            return ApiResponse.success(reply, result, "Company offer found");
        }
    );

    // GET /company-offers/company/:companyId (JWT protected)
    app.get('/company/:companyId',
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
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
