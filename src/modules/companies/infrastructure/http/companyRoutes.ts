import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { multipartParserMiddleware } from '../../../../shared/infrastructure/http/middlewares/multipartMiddleware';
import { CreateCompanyUseCase } from '../../application/createCompanyUseCase';
import { GetCompanyByIdUseCase } from '../../application/getCompanyByIdUseCase';
import { GetMyCompanyByIdUseCase } from '../../application/getMyCompanyByIdUseCase';
import { UpdateCompanyUseCase } from '../../application/updateCompanyUseCase';
import { ListCompaniesUseCase } from '../../application/listCompaniesUseCase';

import { AddLocationUseCase } from '../../application/addLocationUseCase';
import { UpdateLocationUseCase } from '../../application/updateLocationUseCase';
import { RemoveLocationUseCase } from '../../application/removeLocationUseCase';
import { GetLocationsByCompanyUseCase } from '../../application/getLocationsByCompanyUseCase';

import { AddContactUseCase } from '../../application/addContactUseCase';
import { UpdateContactUseCase } from '../../application/updateContactUseCase';
import { RemoveContactUseCase } from '../../application/removeContactUseCase';
import { GetContactsByCompanyUseCase } from '../../application/getContactsByCompanyUseCase';

import { GetCommercialProfileUseCase } from '../../application/getCommercialProfileUseCase';
import { UpdateCommercialProfileUseCase } from '../../application/updateCommercialProfileUseCase';

import { GetVerificationStatusUseCase } from '../../application/getVerificationStatusUseCase';
import { SubmitVerificationDocumentUseCase } from '../../application/submitVerificationDocumentUseCase';

import { GetSettingsUseCase } from '../../application/getSettingsUseCase';
import { UpdateSettingsUseCase } from '../../application/updateSettingsUseCase';
import { GetCompanyReviewsUseCase } from '../../application/getCompanyReviewsUseCase';

export async function companyRoutes(app: FastifyInstance) {

    // ==========================================
    // CORE COMPANY
    // ==========================================

    app.post('/', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new CreateCompanyUseCase();
        const result = await useCase.execute({ ...request.body, creatorId: request.user.userId });
        return ApiResponse.success(reply, result, "Company successfully created", 201);
    });

    app.get('/:id', { preHandler: [authMiddleware] } as any, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const useCase = new GetCompanyByIdUseCase();
        const result = await useCase.execute(request.params.id);
        return ApiResponse.success(reply, result, "Company found");
    });

    app.get('/me', { preHandler: [authMiddleware] } as any, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const useCase = new GetMyCompanyByIdUseCase();
        const result = await useCase.execute(request?.user?.companyId);
        return ApiResponse.success(reply, result, "Company found");
    });

    app.patch('/:id', { preHandler: [authMiddleware, multipartParserMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new UpdateCompanyUseCase();
        const result = await useCase.execute({
            ...request.body as any,
            rawFiles: request.uploadedFiles || [],
            id: request.params.id
        });
        return ApiResponse.success(reply, result, "Company updated");
    });

    app.get('/', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new ListCompaniesUseCase();
        const query = request.query || {};
        const result = await useCase.execute({
            ...query,
            page: query.page ? parseInt(query.page, 10) : 1,
            limit: query.limit ? parseInt(query.limit, 10) : 10
        });
        return ApiResponse.success(reply, result, "Companies listed");
    });

    // ==========================================
    // LOCATIONS
    // ==========================================

    app.get('/:companyId/locations', async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        const useCase = new GetLocationsByCompanyUseCase();
        const result = await useCase.execute(request.params.companyId);
        return ApiResponse.success(reply, result, "Locations found");
    });

    app.post('/:companyId/locations', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new AddLocationUseCase();
        const result = await useCase.execute({ ...request.body as any, company_id: request.params.companyId });
        return ApiResponse.success(reply, result, "Location added", 201);
    });

    app.patch('/locations/:id', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new UpdateLocationUseCase();
        const result = await useCase.execute({ ...request.body as any, id: request.params.id });
        return ApiResponse.success(reply, result, "Location updated");
    });

    app.delete('/locations/:id', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new RemoveLocationUseCase();
        const result = await useCase.execute(request.params.id);
        return ApiResponse.success(reply, result, "Location removed");
    });

    // ==========================================
    // CONTACTS
    // ==========================================

    app.get('/:companyId/contacts', async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        const useCase = new GetContactsByCompanyUseCase();
        const result = await useCase.execute(request.params.companyId);
        return ApiResponse.success(reply, result, "Contacts found");
    });

    app.post('/:companyId/contacts', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new AddContactUseCase();
        const result = await useCase.execute({ ...request.body as any, company_id: request.params.companyId });
        return ApiResponse.success(reply, result, "Contact added", 201);
    });

    app.patch('/contacts/:id', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new UpdateContactUseCase();
        const result = await useCase.execute({ ...request.body as any, id: request.params.id });
        return ApiResponse.success(reply, result, "Contact updated");
    });

    app.delete('/contacts/:id', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new RemoveContactUseCase();
        const result = await useCase.execute(request.params.id);
        return ApiResponse.success(reply, result, "Contact removed");
    });

    // ==========================================
    // COMMERCIAL PROFILE
    // ==========================================

    app.get('/:companyId/commercial-profile', async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        const useCase = new GetCommercialProfileUseCase();
        const result = await useCase.execute(request.params.companyId);
        return ApiResponse.success(reply, result, "Commercial profile found");
    });

    app.patch('/:companyId/commercial-profile', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new UpdateCommercialProfileUseCase();
        const result = await useCase.execute({ ...request.body as any, company_id: request.params.companyId });
        return ApiResponse.success(reply, result, "Commercial profile updated");
    });

    // ==========================================
    // VERIFICATION
    // ==========================================

    app.get('/:companyId/verification', async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        const useCase = new GetVerificationStatusUseCase();
        const result = await useCase.execute(request.params.companyId);
        return ApiResponse.success(reply, result, "Verification status found");
    });

    app.post('/:companyId/verification/documents', { preHandler: [authMiddleware, multipartParserMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new SubmitVerificationDocumentUseCase();
        const result = await useCase.execute({
            ...request.body as any,
            company_id: request.params.companyId,
            rawFiles: request.uploadedFiles || [] // Pass rawFiles down
        });
        return ApiResponse.success(reply, result, "Document submitted", 201);
    });

    // ==========================================
    // SETTINGS
    // ==========================================

    app.get('/:companyId/settings', async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        const useCase = new GetSettingsUseCase();
        const result = await useCase.execute(request.params.companyId);
        return ApiResponse.success(reply, result, "Settings found");
    });

    app.patch('/:companyId/settings', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new UpdateSettingsUseCase();
        const result = await useCase.execute({ ...request.body as any, company_id: request.params.companyId });
        return ApiResponse.success(reply, result, "Settings updated");
    });

    // ==========================================
    // REVIEWS
    // ==========================================

    app.get('/:id/reviews', { preHandler: [authMiddleware] } as any, async (request: FastifyRequest<{ Params: { id: string }, Querystring: { limit?: string, page?: string } }>, reply: FastifyReply) => {
        const useCase = new GetCompanyReviewsUseCase();
        const limit = request.query.limit ? parseInt(request.query.limit, 10) : 10;
        const page = request.query.page ? parseInt(request.query.page, 10) : 1;
        const result = await useCase.execute({ id: request.params.id, page, limit });
        return ApiResponse.success(reply, result, "Company reviews found");
    });
}
