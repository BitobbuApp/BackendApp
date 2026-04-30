import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CreateAdminUseCase } from '../../application/createAdminUseCase';
import { LoginAdminUseCase } from '../../application/loginAdminUseCase';
import { GetAdminMeUseCase } from '../../application/getAdminMeUseCase';
import { UpdateAdminUseCase } from '../../application/updateAdminUseCase';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';

export async function adminAuthRoutes(app: FastifyInstance) {
    app.post('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new CreateAdminUseCase();
        const result = await useCase.execute(request.body);
        return ApiResponse.success(reply, result, "Admin created successfully");
    });


    app.post('/login', async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new LoginAdminUseCase();
        const result = await useCase.execute(request.body);
        return ApiResponse.success(reply, result, "Login successful");
    });

    app.get('/me', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        const adminId = request.admin?.adminId;
        if (!adminId) {
            return ApiResponse.error(reply, "Unauthorized access", 401, undefined, "AUTH_MISSING_TOKEN", "AUTHENTICATION");
        }

        const useCase = new GetAdminMeUseCase();
        const result = await useCase.execute(adminId);
        return ApiResponse.success(reply, result, "Admin profile retrieved");
    });

    app.patch('/:id', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const useCase = new UpdateAdminUseCase();
        const result = await useCase.execute({ id: request.params.id, data: request.body });
        return ApiResponse.success(reply, result, "Admin updated successfully");
    });
}
