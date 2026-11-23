import { SubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { prisma } from "../../../../shared/infrastructure/database";

export class PrismaSubscriptionRepository implements SubscriptionRepository {
    async findAllAdmin(filters: any, page: number, limit: number): Promise<{ items: any[], total: number }> {
        const skip = (page - 1) * limit;
        const now = new Date();
        const where: any = {};

        // active: current row whose paid period has not ended (free plans have no end).
        // expired: current row past its end, or a row closed by the expiry job.
        // inactive: replaced or cancelled rows.
        if (filters.status === 'active') {
            where.is_active = true;
            where.OR = [{ current_period_end: null }, { current_period_end: { gt: now } }];
        } else if (filters.status === 'expired') {
            where.OR = [
                { is_active: true, current_period_end: { lte: now } },
                { status: 'expired' },
            ];
        } else if (filters.status === 'inactive') {
            where.is_active = false;
            where.status = { not: 'expired' };
        }

        if (filters.company_id) {
            where.company_id = filters.company_id;
        }

        const [total, items] = await Promise.all([
            prisma.subscription.count({ where }),
            prisma.subscription.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    company: { select: { id: true, trade_name: true } },
                    plan: true
                }
            })
        ]);

        return {
            items: items.map((item: any) => ({
                id: item.id,
                company_id: item.company_id,
                company_name: item.company.trade_name,
                plan_id: item.plan_id,
                plan_code: item.plan.code,
                plan_name: item.plan.name_es || item.plan.plan_name,
                amount: Number(item.amount),
                payment_reference: item.payment_reference,
                activation_date: item.current_period_start,
                expiration_date: item.current_period_end,
                is_active: item.is_active,
                created_at: item.created_at,
                status: this.calculateStatus(item, now)
            })),
            total
        };
    }

    private calculateStatus(item: any, now: Date): string {
        if (!item.is_active) return item.status === 'expired' ? 'expired' : 'inactive';
        if (item.current_period_end && new Date(item.current_period_end) <= now) return 'expired';
        return 'active';
    }
}
