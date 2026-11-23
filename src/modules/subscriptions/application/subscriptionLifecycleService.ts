import { Prisma } from '@prisma/client';
import { prisma } from '../../../shared/infrastructure/database';
import { ApplicationError } from '../../../shared/domain/error';
import { settings } from '../../settings/application/settingsService';
import { DAY_MS } from './planPeriod';

type Db = Prisma.TransactionClient | typeof prisma;

/** A plan with price 0 never expires (current_period_end stays NULL). */
export const isFreePlan = (plan: { price: Prisma.Decimal | number | string }) => Number(plan.price) === 0;

interface ActivatePlanInput {
    companyId: string;
    planId: string;
    /** Same plan still running: add a new period after the current end instead of restarting today. */
    extendIfSamePlan?: boolean;
    amount?: number;
    paymentReference?: string | null;
    now?: Date;
}

/**
 * All writes that move a company between plans. Every change is transactional:
 * the partial unique index allows only one active subscription per company.
 */
export class SubscriptionLifecycleService {
    /** Gives the company the default (free) plan unless it already has an active subscription. Idempotent. */
    async assignDefaultPlan(companyId: string, db: Db = prisma) {
        const active = await db.subscription.findFirst({ where: { company_id: companyId, is_active: true } });
        if (active) return active;

        const plan = await db.subscriptionPlan.findFirst({ where: { is_default: true, is_active: true } });
        if (!plan) throw new ApplicationError(500, 'No default subscription plan configured', 'INTERNAL_SERVER_ERROR', 'INTERNAL');

        return db.subscription.create({
            data: {
                company_id: companyId,
                plan_id: plan.id,
                amount: 0,
                status: 'active',
                is_active: true,
                current_period_start: new Date(),
                current_period_end: null,
            },
        });
    }

    async activatePlan(input: ActivatePlanInput, tx?: Prisma.TransactionClient) {
        const run = async (db: Prisma.TransactionClient) => {
            const now = input.now ?? new Date();
            const plan = await db.subscriptionPlan.findUnique({ where: { id: input.planId } });
            if (!plan || !plan.is_active) {
                throw new ApplicationError(404, 'Subscription plan not found or inactive', 'NOT_FOUND', 'NOT_FOUND');
            }

            const current = await db.subscription.findFirst({ where: { company_id: input.companyId, is_active: true } });

            if (isFreePlan(plan)) {
                if (current?.plan_id === plan.id) return current;
                if (current) await this.close(db, current.id, 'cancelled');
                return db.subscription.create({
                    data: {
                        company_id: input.companyId, plan_id: plan.id, amount: 0, status: 'active',
                        is_active: true, current_period_start: now, current_period_end: null,
                    },
                });
            }

            const periodMs = plan.billing_cycle * DAY_MS;
            const sameRunningPlan = input.extendIfSamePlan !== false
                && current?.plan_id === plan.id
                && current.current_period_end
                && current.current_period_end > now;

            if (sameRunningPlan) {
                // Renewal paid before the end: stack the new period on top of the current one.
                return db.subscription.update({
                    where: { id: current!.id },
                    data: {
                        current_period_end: new Date(current!.current_period_end!.getTime() + periodMs),
                        amount: input.amount ?? plan.price,
                        payment_reference: input.paymentReference ?? current!.payment_reference,
                        status: 'active',
                        updated_at: now,
                    },
                });
            }

            if (current) await this.close(db, current.id, 'cancelled');
            return db.subscription.create({
                data: {
                    company_id: input.companyId,
                    plan_id: plan.id,
                    amount: input.amount ?? plan.price,
                    payment_reference: input.paymentReference ?? null,
                    status: 'active',
                    is_active: true,
                    current_period_start: now,
                    current_period_end: new Date(now.getTime() + periodMs),
                },
            });
        };
        return tx ? run(tx) : prisma.$transaction(run);
    }

    /** Pushes the end of the current paid period. Free plans never expire, so there is nothing to extend. */
    async extendDays(companyId: string, days: number, now = new Date()) {
        const current = await prisma.subscription.findFirst({
            where: { company_id: companyId, is_active: true },
            include: { plan: true },
        });
        if (!current) throw new ApplicationError(404, 'Company has no active subscription', 'NOT_FOUND', 'NOT_FOUND');
        if (!current.current_period_end) {
            throw new ApplicationError(400, 'Free plans do not expire; assign a paid plan first', 'VALIDATION_ERROR', 'VALIDATION');
        }
        const base = current.current_period_end > now ? current.current_period_end : now;
        return prisma.subscription.update({
            where: { id: current.id },
            data: { current_period_end: new Date(base.getTime() + days * DAY_MS), status: 'active', updated_at: now },
        });
    }

    /** Paid subscriptions past their end plus the grace period go back to the free plan. Returns affected company ids. */
    async expireOverdue(now = new Date()): Promise<string[]> {
        const graceDays = settings.get<number>('plans.grace_days') ?? 3;
        const cutoff = new Date(now.getTime() - graceDays * DAY_MS);
        const overdue = await prisma.subscription.findMany({
            where: { is_active: true, current_period_end: { not: null, lt: cutoff } },
            select: { id: true, company_id: true },
        });

        const expired: string[] = [];
        for (const sub of overdue) {
            await prisma.$transaction(async (tx) => {
                await this.close(tx, sub.id, 'expired');
                await this.assignDefaultPlan(sub.company_id, tx);
            });
            expired.push(sub.company_id);
        }
        return expired;
    }

    private close(db: Db, id: string, status: 'cancelled' | 'expired') {
        return db.subscription.update({ where: { id }, data: { is_active: false, status, updated_at: new Date() } });
    }
}

export const subscriptionLifecycle = new SubscriptionLifecycleService();
