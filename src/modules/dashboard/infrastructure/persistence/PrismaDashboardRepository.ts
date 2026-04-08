import { DashboardRepository, DashboardStats } from "../../domain/repositories/dashboard.repository";
import { prisma } from "../../../../shared/infrastructure/database";

export class PrismaDashboardRepository implements DashboardRepository {
    async getStats(companyId: string): Promise<DashboardStats> {
        // --- Buyer Stats ---
        const solicitudesGeneradas = await prisma.request.count({
            where: { company_id: companyId }
        });

        const cotizacionesRecibidas = await prisma.quoteResponse.count({
            where: {
                request: { company_id: companyId }
            }
        });

        const comprasGeneradas = await prisma.transaction.count({
            where: { buyer_id: companyId, status: 'completed' }
        });

        const ahorroEstimado = 0; // Placeholder for future logic

        // --- Supplier Stats ---
        const catOfInterest = await prisma.companyCategoryOfInterest.findMany({
            where: { company_id: companyId },
            select: { category_id: true }
        });
        const catIds = catOfInterest.map(c => c.category_id);

        const solicitudesRecibidas = await prisma.request.count({
            where: {
                category_id: { in: catIds },
                company_id: { not: companyId },
                status: 'active'
            }
        });

        const cotizacionesCreadas = await prisma.quoteResponse.count({
            where: { supplier_id: companyId }
        });

        const ventasGeneradas = await prisma.transaction.count({
            where: { supplier_id: companyId, status: 'completed' }
        });

        const ingresosAggregate = await prisma.transaction.aggregate({
            _sum: { total_amount: true },
            where: { supplier_id: companyId, status: 'completed' }
        });

        return {
            buyer_stats: {
                generated_requests: solicitudesGeneradas,
                received_quotes: cotizacionesRecibidas,
                generated_purchases: comprasGeneradas,
                estimated_savings: ahorroEstimado
            },
            supplier_stats: {
                received_requests: solicitudesRecibidas,
                created_quotes: cotizacionesCreadas,
                generated_sales: ventasGeneradas,
                generated_revenue: Number(ingresosAggregate._sum.total_amount || 0)
            }
        };
    }
}
