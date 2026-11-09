import { prisma } from '../../../shared/infrastructure/database';
import { settings } from '../../settings/application/settingsService';
import { DAY_MS, endOfZonedDay, monthRange } from './planPeriod';
import { isFreePlan } from './subscriptionLifecycleService';
import { PlanLimitReachedError } from '../domain/errors/subscription.errors';

export type MeteredOperation = 'quote' | 'offer';

export interface Entitlements {
    plan: { id: string; code: string; name: string; name_es: string; price: number; billing_cycle: number };
    subscription: { id: string; status: string; current_period_start: Date; current_period_end: Date | null } | null;
    /** True while a paid plan is past its end but still inside the grace days. */
    in_grace: boolean;
    /** Free plan running without limits until this instant (end of the configured business day). */
    free_unlimited_until: Date | null;
    limits: { quotes_per_month: number | null; active_offers: number | null };
    usage: { quotes_this_month: number; active_offers: number };
    period: { start: Date; end: Date };
}

/**
 * Resolves what a company may do right now. Usage is counted from the source tables
 * (quote_responses, company_offers) instead of counters, so there is nothing to reset each month.
 */
export class EntitlementsService {
    async get(companyId: string, now = new Date()): Promise<Entitlements> {
        const timeZone = settings.get<string>('plans.usage_timezone') || 'America/Caracas';
        const graceDays = settings.get<number>('plans.grace_days') ?? 3;

        const subscription = await prisma.subscription.findFirst({
            where: { company_id: companyId, is_active: true },
            include: { plan: true },
        });

        let plan = subscription?.plan ?? null;
        let inGrace = false;
        const end = subscription?.current_period_end ?? null;
        if (end && end <= now) {
            if (now.getTime() - end.getTime() <= graceDays * DAY_MS) {
                inGrace = true;
            } else {
                // Past the grace period but the daily job has not run yet: behave as free already.
                plan = null;
            }
        }
        if (!plan) {
            plan = await prisma.subscriptionPlan.findFirst({ where: { is_default: true, is_active: true } });
        }
        if (!plan) throw new Error('No default subscription plan configured');

        const freeUntil = endOfZonedDay(settings.get<string>('plans.free_unlimited_until'), timeZone);
        const freeUnlimited = isFreePlan(plan) && !!freeUntil && now < freeUntil;

        const period = monthRange(now, timeZone);
        const [quotesThisMonth, activeOffers] = await Promise.all([
            prisma.quoteResponse.count({
                where: { supplier_id: companyId, created_at: { gte: period.start, lt: period.end } },
            }),
            prisma.companyOffer.count({ where: { company_id: companyId, is_active: true, deleted_at: null } }),
        ]);

        return {
            plan: {
                id: plan.id, code: plan.code, name: plan.plan_name, name_es: plan.name_es,
                price: Number(plan.price), billing_cycle: plan.billing_cycle,
            },
            subscription: subscription && plan.id === subscription.plan_id
                ? {
                    id: subscription.id, status: inGrace ? 'grace' : subscription.status,
                    current_period_start: subscription.current_period_start,
                    current_period_end: subscription.current_period_end,
                }
                : null,
            in_grace: inGrace,
            free_unlimited_until: freeUnlimited ? freeUntil : null,
            limits: freeUnlimited
                ? { quotes_per_month: null, active_offers: null }
                : { quotes_per_month: plan.max_quotes_per_month, active_offers: plan.max_active_offers },
            usage: { quotes_this_month: quotesThisMonth, active_offers: activeOffers },
            period,
        };
    }

    /** Throws 402 PLAN_LIMIT_REACHED when one more operation would exceed the plan. */
    async assertCanPerform(companyId: string, operation: MeteredOperation, now = new Date()): Promise<void> {
        const e = await this.get(companyId, now);
        const [limit, used] = operation === 'quote'
            ? [e.limits.quotes_per_month, e.usage.quotes_this_month]
            : [e.limits.active_offers, e.usage.active_offers];
        if (limit !== null && used >= limit) {
            throw new PlanLimitReachedError(operation, limit, used, e.plan.code);
        }
    }
}

export const entitlements = new EntitlementsService();
