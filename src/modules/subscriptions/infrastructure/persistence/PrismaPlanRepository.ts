import { PlanRepository } from "../../domain/repositories/plan.repository";
import { prisma } from "../../../../shared/infrastructure/database";

export class PrismaPlanRepository implements PlanRepository {
    async findById(id: string): Promise<any | null> {
        return await prisma.subscriptionPlan.findUnique({
            where: { id }
        });
    }

    async findAllActive(): Promise<any[]> {
        return await prisma.subscriptionPlan.findMany({
            where: { is_active: true }
        });
    }

    async findDefault(): Promise<any | null> {
        return await prisma.subscriptionPlan.findFirst({
            where: { is_default: true, is_active: true }
        });
    }

    async findOne(filters: any): Promise<any | null> {
        return await prisma.subscriptionPlan.findFirst({
            where: { ...filters, is_active: true }
        });
    }
}
