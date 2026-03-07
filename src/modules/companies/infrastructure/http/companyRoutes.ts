import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { PrismaCompanyRepository } from '../persistence/PrismaCompanyRepository';
import { CreateCompanyUseCase } from '../../application/createCompanyUseCase';
import { GetCompanyByIdUseCase } from '../../application/getCompanyByIdUseCase';
import { UpdateCompanyUseCase } from '../../application/updateCompanyUseCase';
import { ListCompaniesUseCase } from '../../application/listCompaniesUseCase';
import { PrismaLocationRepository } from '../persistence/PrismaLocationRepository';
import { AddLocationUseCase } from '../../application/addLocationUseCase';
import { UpdateLocationUseCase } from '../../application/updateLocationUseCase';
import { RemoveLocationUseCase } from '../../application/removeLocationUseCase';
import { GetLocationsByCompanyUseCase } from '../../application/getLocationsByCompanyUseCase';

import { PrismaContactRepository } from '../persistence/PrismaContactRepository';
import { AddContactUseCase } from '../../application/addContactUseCase';
import { UpdateContactUseCase } from '../../application/updateContactUseCase';
import { RemoveContactUseCase } from '../../application/removeContactUseCase';
import { GetContactsByCompanyUseCase } from '../../application/getContactsByCompanyUseCase';

import { PrismaCommercialProfileRepository } from '../persistence/PrismaCommercialProfileRepository';
import { GetCommercialProfileUseCase } from '../../application/getCommercialProfileUseCase';
import { UpdateCommercialProfileUseCase } from '../../application/updateCommercialProfileUseCase';

import { PrismaVerificationRepository } from '../persistence/PrismaVerificationRepository';
import { GetVerificationStatusUseCase } from '../../application/getVerificationStatusUseCase';
import { SubmitVerificationDocumentUseCase } from '../../application/submitVerificationDocumentUseCase';

import { PrismaSettingsRepository } from '../persistence/PrismaSettingsRepository';
import { GetSettingsUseCase } from '../../application/getSettingsUseCase';
import { UpdateSettingsUseCase } from '../../application/updateSettingsUseCase';

export async function companyRoutes(app: FastifyInstance) {

    // ==========================================
    // CORE COMPANY
    // ==========================================

    app.post('/', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new CreateCompanyUseCase(new PrismaCompanyRepository());
        const result = await useCase.execute(request.body);
        return ApiResponse.success(reply, result, "Company successfully created", 201);
    });

    app.get('/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const useCase = new GetCompanyByIdUseCase(new PrismaCompanyRepository());
        const result = await useCase.execute(request.params.id);
        return ApiResponse.success(reply, result, "Company found");
    });

    app.patch('/:id', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new UpdateCompanyUseCase(new PrismaCompanyRepository());
        const result = await useCase.execute({ ...request.body as any, id: request.params.id });
        return ApiResponse.success(reply, result, "Company updated");
    });

    app.get('/', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new ListCompaniesUseCase(new PrismaCompanyRepository());
        const result = await useCase.execute(request.query);
        return ApiResponse.success(reply, result, "Companies listed");
    });

    // ==========================================
    // LOCATIONS
    // ==========================================

    app.get('/:companyId/locations', async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        const useCase = new GetLocationsByCompanyUseCase(new PrismaLocationRepository());
        const result = await useCase.execute(request.params.companyId);
        return ApiResponse.success(reply, result, "Locations found");
    });

    app.post('/:companyId/locations', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new AddLocationUseCase(new PrismaLocationRepository());
        const result = await useCase.execute({ ...request.body as any, company_id: request.params.companyId });
        return ApiResponse.success(reply, result, "Location added", 201);
    });

    app.patch('/locations/:id', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new UpdateLocationUseCase(new PrismaLocationRepository());
        const result = await useCase.execute({ ...request.body as any, id: request.params.id });
        return ApiResponse.success(reply, result, "Location updated");
    });

    app.delete('/locations/:id', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new RemoveLocationUseCase(new PrismaLocationRepository());
        const result = await useCase.execute(request.params.id);
        return ApiResponse.success(reply, result, "Location removed");
    });

    // ==========================================
    // CONTACTS
    // ==========================================

    app.get('/:companyId/contacts', async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        const useCase = new GetContactsByCompanyUseCase(new PrismaContactRepository());
        const result = await useCase.execute(request.params.companyId);
        return ApiResponse.success(reply, result, "Contacts found");
    });

    app.post('/:companyId/contacts', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new AddContactUseCase(new PrismaContactRepository());
        const result = await useCase.execute({ ...request.body as any, company_id: request.params.companyId });
        return ApiResponse.success(reply, result, "Contact added", 201);
    });

    app.patch('/contacts/:id', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new UpdateContactUseCase(new PrismaContactRepository());
        const result = await useCase.execute({ ...request.body as any, id: request.params.id });
        return ApiResponse.success(reply, result, "Contact updated");
    });

    app.delete('/contacts/:id', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new RemoveContactUseCase(new PrismaContactRepository());
        const result = await useCase.execute(request.params.id);
        return ApiResponse.success(reply, result, "Contact removed");
    });

    // ==========================================
    // COMMERCIAL PROFILE
    // ==========================================

    app.get('/:companyId/commercial-profile', async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        const useCase = new GetCommercialProfileUseCase(new PrismaCommercialProfileRepository());
        const result = await useCase.execute(request.params.companyId);
        return ApiResponse.success(reply, result, "Commercial profile found");
    });

    app.patch('/:companyId/commercial-profile', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new UpdateCommercialProfileUseCase(new PrismaCommercialProfileRepository());
        const result = await useCase.execute({ ...request.body as any, company_id: request.params.companyId });
        return ApiResponse.success(reply, result, "Commercial profile updated");
    });

    // ==========================================
    // VERIFICATION
    // ==========================================

    app.get('/:companyId/verification', async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        const useCase = new GetVerificationStatusUseCase(new PrismaVerificationRepository());
        const result = await useCase.execute(request.params.companyId);
        return ApiResponse.success(reply, result, "Verification status found");
    });

    app.post('/:companyId/verification/documents', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new SubmitVerificationDocumentUseCase(new PrismaVerificationRepository());
        const result = await useCase.execute({ ...request.body as any, company_id: request.params.companyId });
        return ApiResponse.success(reply, result, "Document submitted", 201);
    });

    // ==========================================
    // SETTINGS
    // ==========================================

    app.get('/:companyId/settings', async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        const useCase = new GetSettingsUseCase(new PrismaSettingsRepository());
        const result = await useCase.execute(request.params.companyId);
        return ApiResponse.success(reply, result, "Settings found");
    });

    app.patch('/:companyId/settings', { preHandler: [authMiddleware] } as any, async (request: any, reply: any) => {
        const useCase = new UpdateSettingsUseCase(new PrismaSettingsRepository());
        const result = await useCase.execute({ ...request.body as any, company_id: request.params.companyId });
        return ApiResponse.success(reply, result, "Settings updated");
    });
}
