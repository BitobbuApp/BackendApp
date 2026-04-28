import { SubscriptionRepository } from "../../domain/repositories/subscription.repository";
import { prisma } from "../../../../shared/infrastructure/database";

export class PrismaSubscriptionRepository implements SubscriptionRepository {
    async findAllAdmin(filters: any, page: number, limit: number): Promise<{ items: any[], total: number }> {
        const skip = (page - 1) * limit;
        const where: any = {};

        if (filters.status) {
            if (filters.status === 'active') {
                where.is_active = true;
                where.OR = [
                    { expires_at: null },
                    { expires_at: { gt: new Date() } }
                ];
            } else if (filters.status === 'expired') {
                where.OR = [
                    { is_active: false },
                    { expires_at: { lt: new Date() } }
                ];
            }
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
                    company: {
                        select: {
                            id: true,
                            trade_name: true
                        }
                    },
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
                plan_name: item.plan.plan_name,
                amount: Number(item.amount),
                starts_at: item.starts_at,
                expires_at: item.expires_at,
                is_active: item.is_active,
                created_at: item.created_at,
                status: this.calculateStatus(item)
            })),
            total
        };
    }

    async findById(id: string): Promise<any | null> {
        return await prisma.subscription.findUnique({
            where: { id },
            include: { company: true, plan: true }
        });
    }

    async update(id: string, data: any): Promise<any> {
        return await prisma.subscription.update({
            where: { id },
            data: {
                ...data,
                updated_at: new Date()
            }
        });
    }

    private calculateStatus(item: any): string {
        if (!item.is_active) return 'inactive';
        if (item.expires_at && new Date(item.expires_at) < new Date()) return 'expired';
        return 'active';
    }
}
