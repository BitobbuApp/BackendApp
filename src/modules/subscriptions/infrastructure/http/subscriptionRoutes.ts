import { FastifyInstance } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { multipartParserMiddleware } from '../../../../shared/infrastructure/http/middlewares/multipartMiddleware';
import { prisma } from '../../../../shared/infrastructure/database';
import { entitlements } from '../../application/entitlementsService';
import { subscriptionPayments } from '../../application/subscriptionPaymentService';
import { analyticsDispatcher } from '../../../analytics/application/analyticsDispatcher';
import { extractAnalyticsContext } from '../../../analytics/infrastructure/http/analyticsContext';

/** Company-facing subscription API: current plan and usage, catalog, and payment reports. */
export async function subscriptionRoutes(app: FastifyInstance) {
    const requireCompany = async (request: any, reply: any) => {
        if (!request.user?.companyId) return ApiResponse.error(reply, 'Company ID not found in session', 403);
    };
    const guard = { preHandler: [authMiddleware, requireCompany] } as any;

    app.get('/me', guard, async (request: any, reply: any) => {
        const companyId = request.user.companyId;
        const [current, payments] = await Promise.all([
            entitlements.get(companyId),
            subscriptionPayments.listForCompany(companyId, 5),
        ]);
        return ApiResponse.success(reply, { ...current, payments, payments_enabled: subscriptionPayments.paymentsEnabled() }, 'Subscription retrieved');
    });

    app.get('/plans', guard, async (_request: any, reply: any) => {
        const [plans, rate] = await Promise.all([
            prisma.subscriptionPlan.findMany({ where: { is_active: true }, orderBy: [{ sort_order: 'asc' }, { price: 'asc' }] }),
            subscriptionPayments.latestUsdVesRate(),
        ]);
        return ApiResponse.success(reply, {
            exchange_rate: rate,
            plans: plans.map((p) => ({
                id: p.id, code: p.code, name: p.plan_name, name_es: p.name_es,
                price_usd: Number(p.price),
                price_ves: rate === null ? null : Math.round(Number(p.price) * rate * 100) / 100,
                billing_cycle: p.billing_cycle,
                max_quotes_per_month: p.max_quotes_per_month,
                max_active_offers: p.max_active_offers,
                is_default: p.is_default,
            })),
        }, 'Plans retrieved');
    });

    app.get('/payment-info', guard, async (_request: any, reply: any) => {
        return ApiResponse.success(reply, subscriptionPayments.paymentInfo(), 'Payment info retrieved');
    });

    app.get('/payments', guard, async (request: any, reply: any) => {
        return ApiResponse.success(reply, await subscriptionPayments.listForCompany(request.user.companyId, 50), 'Payments retrieved');
    });

    app.post('/payments', { preHandler: [authMiddleware, requireCompany, multipartParserMiddleware] } as any, async (request: any, reply: any) => {
        const payment = await subscriptionPayments.report(
            request.user.companyId, request.user.userId, request.body ?? {}, request.uploadedFiles ?? [],
        );

        const ctx = extractAnalyticsContext(request);
        await analyticsDispatcher.track({
            name: 'subscription_payment_reported',
            eventId: ctx.eventId,
            sourceUrl: ctx.sourceUrl,
            user: {
                userId: request.user.userId,
                companyId: request.user.companyId,
                email: request.user.email,
                phone: request.body?.payer_phone,
                ip: ctx.ip,
                userAgent: ctx.userAgent,
                browserIds: ctx.browserIds,
            },
            properties: {
                value: payment.amount_usd,
                currency: 'USD',
                contentType: 'plan',
                contentIds: payment.plan?.id ? [payment.plan.id] : undefined,
                contentName: payment.plan?.name_es || payment.plan?.name,
                planCode: payment.plan?.code,
            },
        });

        return ApiResponse.success(reply, payment, 'Pago reportado; lo verificaremos en breve', 201);
    });
}
