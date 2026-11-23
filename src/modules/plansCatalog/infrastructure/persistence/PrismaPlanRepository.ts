import { PlanRepository } from "../../domain/repositories/plan.repository";
import { prisma } from "../../../../shared/infrastructure/database";

const toAdminPlan = (item: any) => ({
    id: item.id,
    code: item.code,
    name: item.plan_name,
    name_es: item.name_es,
    price: Number(item.price),
    billing_cycle: item.billing_cycle,
    // null = unlimited
    max_quotes_per_month: item.max_quotes_per_month,
    max_active_offers: item.max_active_offers,
    is_default: item.is_default,
    sort_order: item.sort_order,
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.updated_at
});

// API field -> column. Only the fields listed here can be written.
const WRITABLE: Record<string, string> = {
    code: 'code',
    name: 'plan_name',
    name_es: 'name_es',
    price: 'price',
    billing_cycle: 'billing_cycle',
    max_quotes_per_month: 'max_quotes_per_month',
    max_active_offers: 'max_active_offers',
    is_default: 'is_default',
    sort_order: 'sort_order',
    is_active: 'is_active',
};

function toColumns(data: any) {
    const out: any = {};
    for (const [field, column] of Object.entries(WRITABLE)) {
        if (data[field] !== undefined) out[column] = data[field];
    }
    return out;
}

export class PrismaPlanRepository implements PlanRepository {
    async findAllAdmin(filters: any): Promise<any[]> {
        const where: any = {};
        if (filters.is_active !== undefined) {
            where.is_active = filters.is_active;
        }

        const items = await prisma.subscriptionPlan.findMany({
            where,
            orderBy: [{ sort_order: 'asc' }, { price: 'asc' }]
        });

        return items.map(toAdminPlan);
    }

    async findById(id: string): Promise<any | null> {
        return await prisma.subscriptionPlan.findUnique({ where: { id } });
    }

    async findByCode(code: string): Promise<any | null> {
        return await prisma.subscriptionPlan.findUnique({ where: { code } });
    }

    async create(data: any): Promise<any> {
        return prisma.$transaction(async (tx) => {
            // Only one default plan: the one new companies start on.
            if (data.is_default) await tx.subscriptionPlan.updateMany({ data: { is_default: false } });
            const created = await tx.subscriptionPlan.create({ data: toColumns(data) });
            return toAdminPlan(created);
        });
    }

    async update(id: string, data: any): Promise<any> {
        return prisma.$transaction(async (tx) => {
            if (data.is_default) await tx.subscriptionPlan.updateMany({ where: { id: { not: id } }, data: { is_default: false } });
            const updated = await tx.subscriptionPlan.update({
                where: { id },
                data: { ...toColumns(data), updated_at: new Date() }
            });
            return toAdminPlan(updated);
        });
    }
}
