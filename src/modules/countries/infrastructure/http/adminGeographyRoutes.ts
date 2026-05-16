import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListCountriesUseCase } from '../../application/adminListCountriesUseCase';
import { AdminUpsertCountryUseCase } from '../../application/adminUpsertCountryUseCase';
import { AdminUpdateCountryStatusUseCase } from '../../application/adminUpdateCountryStatusUseCase';

import { AdminListStatesUseCase } from '../../../states/application/adminListStatesUseCase';
import { AdminUpsertStateUseCase } from '../../../states/application/adminUpsertStateUseCase';
import { AdminUpdateStateStatusUseCase } from '../../../states/application/adminUpdateStateStatusUseCase';

export async function adminGeographyRoutes(app: FastifyInstance) {
    // Countries
    app.get('/countries', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new AdminListCountriesUseCase();
        const result = await useCase.execute({});
        return ApiResponse.success(reply, result, "Countries retrieved successfully");
    });

    app.post('/countries', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpsertCountryUseCase();
        const result = await useCase.execute({ data: request.body });
        return ApiResponse.success(reply, result, "Country created successfully", 201);
    });

    app.patch('/countries/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: number }, Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpsertCountryUseCase();
        const result = await useCase.execute({ id: Number(request.params.id), data: request.body });
        return ApiResponse.success(reply, result, "Country updated successfully");
    });

    app.patch('/countries/:id/status', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: number }, Body: { status: string } }>, reply: FastifyReply) => {
        const useCase = new AdminUpdateCountryStatusUseCase();
        const isActive = request.body.status === 'active';
        const result = await useCase.execute({ id: Number(request.params.id), status: isActive });
        return ApiResponse.success(reply, result, "Country status updated successfully");
    });

    // States
    app.get('/states', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: { country_id?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminListStatesUseCase();
        const countryId = request.query.country_id ? Number(request.query.country_id) : undefined;
        const result = await useCase.execute({ country_id: countryId });
        return ApiResponse.success(reply, result, "States retrieved successfully");
    });

    app.post('/states', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpsertStateUseCase();
        const result = await useCase.execute({ data: request.body });
        return ApiResponse.success(reply, result, "State created successfully", 201);
    });

    app.patch('/states/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: number }, Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpsertStateUseCase();
        const result = await useCase.execute({ id: Number(request.params.id), data: request.body });
        return ApiResponse.success(reply, result, "State updated successfully");
    });

    app.patch('/states/:id/status', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: number }, Body: { status: string } }>, reply: FastifyReply) => {
        const useCase = new AdminUpdateStateStatusUseCase();
        const isActive = request.body.status === 'active';
        const result = await useCase.execute({ id: Number(request.params.id), status: isActive });
        return ApiResponse.success(reply, result, "State status updated successfully");
    });
}
