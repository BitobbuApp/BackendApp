import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListUsersUseCase } from '../../application/adminListUsersUseCase';
import { AdminGetUserDetailsUseCase } from '../../application/adminGetUserDetailsUseCase';
import { AdminUpdateUserStatusUseCase } from '../../application/adminUpdateUserStatusUseCase';

interface AdminUserQuery {
    page?: string;
    limit?: string;
    search?: string;
    status?: string;
    company_id?: string;
}

export async function adminUserRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: AdminUserQuery }>, reply: FastifyReply) => {
        const useCase = new AdminListUsersUseCase();
        const result = await useCase.execute({
            page: request.query.page ? Number(request.query.page) : 1,
            limit: request.query.limit ? Number(request.query.limit) : 10,
            search: request.query.search,
            status: request.query.status,
            company_id: request.query.company_id
        });
        return ApiResponse.success(reply, result, "Users retrieved successfully");
    });

    app.get('/:id', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const useCase = new AdminGetUserDetailsUseCase();
        const result = await useCase.execute(request.params.id);
        return ApiResponse.success(reply, result, "User details retrieved successfully");
    });

    app.patch('/:id/status', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'ops_admin'])] as any }, async (request: FastifyRequest<{ Params: { id: string }, Body: { status: string, reason: string } }>, reply: FastifyReply) => {
        const useCase = new AdminUpdateUserStatusUseCase();
        const result = await useCase.execute({
            id: request.params.id,
            status: request.body.status,
            reason: request.body.reason
        });
        return ApiResponse.success(reply, result, "User status updated successfully");
    });
}
