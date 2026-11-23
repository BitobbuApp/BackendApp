import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import Joi from 'joi';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { ValidationError } from '../../../../shared/domain/error';
import { PrismaAdminRepository } from '../../../admins/infrastructure/persistence/PrismaAdminRepository';
import { subscriptionPayments } from '../../application/subscriptionPaymentService';

const listSchema = Joi.object({
    status: Joi.string().valid('pending', 'approved', 'rejected').optional(),
    company_id: Joi.string().uuid().optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
});

export async function adminSubscriptionPaymentRoutes(app: FastifyInstance) {
    const adminRepo = new PrismaAdminRepository();
    // Ops admins verify payments against the bank, so they can both read and review.
    const read = { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin', 'ops_admin'])] as any };
    const review = read;

    app.get('/', read, async (request: FastifyRequest<{ Querystring: any }>, reply: FastifyReply) => {
        const { error, value } = listSchema.validate(request.query);
        if (error) throw new ValidationError(error.details.map((d) => d.message));
        const { page, limit, ...filters } = value;
        return ApiResponse.success(reply, await subscriptionPayments.adminList(filters, page, limit), 'Payments retrieved');
    });

    app.get('/:id/receipt', read, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, await subscriptionPayments.receiptUrl(request.params.id), 'Receipt URL generated');
    });

    app.post('/:id/approve', review, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const adminId = request.admin!.adminId;
        const result = await subscriptionPayments.approve(request.params.id, adminId);
        await adminRepo.logAuditAction(adminId, 'approve', 'subscription_payment', request.params.id, { subscription_id: result.subscription_id });
        return ApiResponse.success(reply, result, 'Payment approved');
    });

    app.post('/:id/reject', review, async (request: FastifyRequest<{ Params: { id: string }, Body: { reason?: string } }>, reply: FastifyReply) => {
        const reason = request.body?.reason?.trim();
        if (!reason) throw new ValidationError(['reason is required']);
        const adminId = request.admin!.adminId;
        const result = await subscriptionPayments.reject(request.params.id, adminId, reason);
        await adminRepo.logAuditAction(adminId, 'reject', 'subscription_payment', request.params.id, { reason });
        return ApiResponse.success(reply, result, 'Payment rejected');
    });
}
