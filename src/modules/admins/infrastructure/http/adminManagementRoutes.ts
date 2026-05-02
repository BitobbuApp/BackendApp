import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListAdminsUseCase } from '../../application/adminListAdminsUseCase';
import { CreateAdminUseCase } from '../../application/createAdminUseCase';
import { UpdateAdminUseCase } from '../../application/updateAdminUseCase';
import { PrismaAdminRepository } from '../persistence/PrismaAdminRepository';

export async function adminManagementRoutes(app: FastifyInstance) {
    const adminRepo = new PrismaAdminRepository();

    // List all admins
    app.get('/', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin'])] as any }, async (request: FastifyRequest, reply: FastifyReply) => {
        const useCase = new AdminListAdminsUseCase();
        const result = await useCase.execute({});
        return ApiResponse.success(reply, result, "Admins retrieved successfully");
    });

    // Create new admin
    app.post('/', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin'])] as any }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const useCase = new CreateAdminUseCase();
        const result = await useCase.execute(request.body);
        return ApiResponse.success(reply, result, "Admin created successfully", 201);
    });

    // Update admin
    app.patch('/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin'])] as any }, async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
        const useCase = new UpdateAdminUseCase();
        const result = await useCase.execute({ id: request.params.id, ...(request.body as object) });
        return ApiResponse.success(reply, result, "Admin updated successfully");
    });

    // Delete admin
    app.delete('/:id', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin'])] as any }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        await adminRepo.delete(request.params.id);
        return ApiResponse.success(reply, null, "Admin deleted successfully");
    });
}
