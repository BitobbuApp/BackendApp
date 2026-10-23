import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListSubcategoriesUseCase } from '../../application/adminListSubcategoriesUseCase';
import { AdminCreateSubcategoryUseCase } from '../../application/adminCreateSubcategoryUseCase';
import { AdminUpdateSubcategoryUseCase } from '../../application/adminUpdateSubcategoryUseCase';
import { AdminUpdateSubcategoryStatusUseCase } from '../../application/adminUpdateSubcategoryStatusUseCase';

const catalogWriters = [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'catalog_admin'])] as any;

// Subcategories are never deleted: there is intentionally no DELETE route (deactivate instead).
export async function adminSubcategoryRoutes(app: FastifyInstance) {
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: { category_id?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminListSubcategoriesUseCase();
        const categoryId = request.query.category_id ? Number(request.query.category_id) : undefined;
        const result = await useCase.execute({ category_id: categoryId });
        return ApiResponse.success(reply, result, "Subcategories retrieved successfully");
    });

    app.post('/', { preHandler: catalogWriters }, async (request: FastifyRequest<{ Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminCreateSubcategoryUseCase();
        const result = await useCase.execute(request.body);
        return ApiResponse.success(reply, result, "Subcategory created successfully", 201);
    });

    app.patch('/:id', { preHandler: catalogWriters }, async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpdateSubcategoryUseCase();
        const result = await useCase.execute({ id: Number(request.params.id), data: request.body });
        return ApiResponse.success(reply, result, "Subcategory updated successfully");
    });

    app.patch('/:id/status', { preHandler: catalogWriters }, async (request: FastifyRequest<{ Params: { id: string }, Body: any }>, reply: FastifyReply) => {
        const useCase = new AdminUpdateSubcategoryStatusUseCase();
        const result = await useCase.execute({ id: Number(request.params.id), is_active: (request.body as any)?.is_active });
        return ApiResponse.success(reply, result, "Subcategory status updated successfully");
    });
}
