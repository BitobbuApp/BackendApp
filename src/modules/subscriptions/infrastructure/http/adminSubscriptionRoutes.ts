import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Joi from 'joi';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { adminAuthMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminAuthMiddleware';
import { adminScopeMiddleware } from '../../../../shared/infrastructure/http/middlewares/adminScopeMiddleware';
import { ApplicationError, ValidationError } from '../../../../shared/domain/error';
import { prisma } from '../../../../shared/infrastructure/database';
import { PrismaAdminRepository } from '../../../admins/infrastructure/persistence/PrismaAdminRepository';
import { AdminListSubscriptionsUseCase } from '../../application/adminListSubscriptionsUseCase';
import { subscriptionLifecycle } from '../../application/subscriptionLifecycleService';
import { entitlements } from '../../application/entitlementsService';

interface AdminSubscriptionQuery {
    page?: string;
    limit?: string;
    status?: string;
    company_id?: string;
}

function validate<T>(schema: Joi.Schema, value: unknown): T {
    const { error, value: out } = schema.validate(value, { abortEarly: false });
    if (error) throw new ValidationError(error.details.map((d) => d.message));
    return out as T;
}

const changePlanSchema = Joi.object({
    plan_code: Joi.string().required(),
    reason: Joi.string().trim().min(3).max(255).required(),
});
const extendSchema = Joi.object({
    days: Joi.number().integer().min(1).max(365).required(),
    reason: Joi.string().trim().min(3).max(255).required(),
});

export async function adminSubscriptionRoutes(app: FastifyInstance) {
    const adminRepo = new PrismaAdminRepository();
    const superadmin = { preHandler: [adminAuthMiddleware, adminScopeMiddleware(['superadmin'])] as any };

    app.get('/', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Querystring: AdminSubscriptionQuery }>, reply: FastifyReply) => {
        const useCase = new AdminListSubscriptionsUseCase();
        const result = await useCase.execute({
            page: request.query.page ? Number(request.query.page) : 1,
            limit: request.query.limit ? Number(request.query.limit) : 10,
            status: request.query.status,
            company_id: request.query.company_id
        });
        return ApiResponse.success(reply, result, "Subscriptions retrieved successfully");
    });

    // Effective plan, limits and usage of the month, as the company sees them.
    app.get('/:companyId/entitlements', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        return ApiResponse.success(reply, await entitlements.get(request.params.companyId), "Entitlements retrieved successfully");
    });

    app.get('/:companyId/history', { preHandler: [adminAuthMiddleware] as any }, async (request: FastifyRequest<{ Params: { companyId: string } }>, reply: FastifyReply) => {
        const items = await prisma.subscription.findMany({
            where: { company_id: request.params.companyId },
            orderBy: { created_at: 'desc' },
            include: { plan: { select: { code: true, plan_name: true, name_es: true } } },
        });
        return ApiResponse.success(reply, items.map((s) => ({
            id: s.id,
            plan_code: s.plan.code,
            plan_name: s.plan.name_es || s.plan.plan_name,
            amount: Number(s.amount),
            payment_reference: s.payment_reference,
            status: s.status,
            is_active: s.is_active,
            current_period_start: s.current_period_start,
            current_period_end: s.current_period_end,
            created_at: s.created_at,
        })), "Subscription history retrieved successfully");
    });

    app.patch('/:companyId/plan', superadmin, async (request: FastifyRequest<{ Params: { companyId: string }, Body: unknown }>, reply: FastifyReply) => {
        const body = validate<{ plan_code: string; reason: string }>(changePlanSchema, request.body);
        const plan = await prisma.subscriptionPlan.findUnique({ where: { code: body.plan_code } });
        if (!plan || !plan.is_active) throw new ApplicationError(404, 'Plan not found or inactive', 'NOT_FOUND', 'NOT_FOUND');

        // A manual change always starts a fresh period (no stacking), and records no payment.
        const subscription = await subscriptionLifecycle.activatePlan({
            companyId: request.params.companyId, planId: plan.id, extendIfSamePlan: false, amount: 0,
        });
        await adminRepo.logAuditAction(request.admin!.adminId, 'change_plan', 'subscription', request.params.companyId, {
            plan_code: plan.code, subscription_id: subscription.id, reason: body.reason,
        });
        return ApiResponse.success(reply, subscription, "Subscription plan updated successfully");
    });

    app.patch('/:companyId/extend-days', superadmin, async (request: FastifyRequest<{ Params: { companyId: string }, Body: unknown }>, reply: FastifyReply) => {
        const body = validate<{ days: number; reason: string }>(extendSchema, request.body);
        const subscription = await subscriptionLifecycle.extendDays(request.params.companyId, body.days);
        await adminRepo.logAuditAction(request.admin!.adminId, 'extend_days', 'subscription', request.params.companyId, {
            days: body.days, current_period_end: subscription.current_period_end, reason: body.reason,
        });
        return ApiResponse.success(reply, subscription, "Subscription days extended successfully");
    });
}
