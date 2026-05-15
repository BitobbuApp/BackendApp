import { PlanRepository } from "../../domain/repositories/plan.repository";
import { prisma } from "../../../../shared/infrastructure/database";

export class PrismaPlanRepository implements PlanRepository {
    async findAllAdmin(filters: any): Promise<any[]> {
        const where: any = {};
        if (filters.is_active !== undefined) {
            where.is_active = filters.is_active;
        }

        const items = await prisma.subscriptionPlan.findMany({
            where,
            orderBy: { price: 'asc' }
        });

        return items.map(item => ({
            id: item.id,
            name: item.plan_name,
            price: Number(item.price),
            billing_cycle: item.billing_cycle,
            is_active: item.is_active,
            created_at: item.created_at,
            updated_at: item.updated_at
        }));
    }

    async findById(id: string): Promise<any | null> {
        return await prisma.subscriptionPlan.findUnique({ where: { id } });
    }

    async create(data: any): Promise<any> {
        return await prisma.subscriptionPlan.create({
            data: {
                plan_name: data.name,
                price: data.price,
                billing_cycle: data.billing_cycle,
                is_active: data.is_active ?? true
            }
        });
    }

    async update(id: string, data: any): Promise<any> {
        const updateData: any = {};
        if (data.name) updateData.plan_name = data.name;
        if (data.price !== undefined) updateData.price = data.price;
        if (data.billing_cycle !== undefined) updateData.billing_cycle = data.billing_cycle;
        if (data.is_active !== undefined) updateData.is_active = data.is_active;

        return await prisma.subscriptionPlan.update({
            where: { id },
            data: {
                ...updateData,
                updated_at: new Date()
            }
        });
    }
}
