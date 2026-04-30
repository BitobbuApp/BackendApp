import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { AdminListPendingVerificationsUseCase } from '../../application/adminListPendingVerificationsUseCase';
import { AdminGetCompanyDocumentsUseCase } from '../../application/adminGetCompanyDocumentsUseCase';
import { AdminReviewDocumentUseCase } from '../../application/adminReviewDocumentUseCase';
import { AdminReviewAllDocumentsUseCase } from '../../application/adminReviewAllDocumentsUseCase';

export async function adminVerificationRoutes(app: FastifyInstance) {
    // List companies pending verification
    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: { page?: string, limit?: string, search?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminListPendingVerificationsUseCase();
        const result = await useCase.execute({
            page: request.query.page ? Number(request.query.page) : 1,
            limit: request.query.limit ? Number(request.query.limit) : 10,
            search: request.query.search
        });
        return ApiResponse.success(reply, result, "Pending verifications retrieved successfully");
    });

    // Get documents for a specific company
    app.get('/:companyId/documents', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        const useCase = new AdminGetCompanyDocumentsUseCase();
        const result = await useCase.execute(request.params.companyId);
        return ApiResponse.success(reply, result, "Company documents retrieved successfully");
    });

    // Review a single document
    app.patch('/documents/:documentId', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'ops_admin'])] as any }, async (request: FastifyRequest<{ Params: { documentId: string }, Body: { status: string, notes?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminReviewDocumentUseCase();
        const result = await useCase.execute({
            document_id: request.params.documentId,
            status: request.body.status,
            notes: request.body.notes,
            reviewer_id: (request as any).admin.id // From adminAuthMiddleware
        });
        return ApiResponse.success(reply, result, "Document reviewed successfully");
    });

    // Bulk review for a company
    app.patch('/:companyId/review-all', { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'ops_admin'])] as any }, async (request: FastifyRequest<{ Params: { companyId: string }, Body: { action: string, reason?: string } }>, reply: FastifyReply) => {
        const useCase = new AdminReviewAllDocumentsUseCase();
        const result = await useCase.execute({
            company_id: request.params.companyId,
            action: request.body.action,
            reason: request.body.reason,
            reviewer_id: (request as any).admin.id
        });
        return ApiResponse.success(reply, result, `All documents ${request.body.action === 'approve_all' ? 'approved' : 'rejected'} successfully`);
    });
}
