import { DashboardRepository, DashboardStats } from "../../domain/repositories/dashboard.repository";
import { prisma } from "../../../../shared/infrastructure/database";

export class PrismaDashboardRepository implements DashboardRepository {
    async getStats(companyId: string): Promise<DashboardStats> {
        // Find company to know permissions
        const company = await prisma.company.findUnique({
            where: { id: companyId },
            select: { can_buy: true, can_sell: true }
        });

        const canBuy = company?.can_buy ?? false;
        const canSell = company?.can_sell ?? false;

        const buyerStats = {
            generated_requests: 0,
            received_quotes: 0,
            generated_purchases: 0,
            estimated_savings: 0
        };

        const supplierStats = {
            received_requests: 0,
            created_quotes: 0,
            generated_sales: 0,
            generated_revenue: 0
        };

        if (canBuy) {
            const [solicitudesGeneradas, cotizacionesRecibidas, comprasGeneradas] = await Promise.all([
                prisma.request.count({ where: { company_id: companyId } }),
                prisma.quoteResponse.count({ where: { request: { company_id: companyId } } }),
                prisma.transaction.count({ where: { buyer_id: companyId, status: 'completed' } })
            ]);

            buyerStats.generated_requests = solicitudesGeneradas;
            buyerStats.received_quotes = cotizacionesRecibidas;
            buyerStats.generated_purchases = comprasGeneradas;
            // buyerStats.estimated_savings remains 0 (Placeholder for future logic)
        }

        if (canSell) {
            const catOfInterest = await prisma.companyCategoryOfInterest.findMany({
                where: { company_id: companyId },
                select: { category_id: true }
            });
            const catIds = catOfInterest.map(c => c.category_id);

            const [solicitudesRecibidas, cotizacionesCreadas, ventasGeneradas, ingresosAggregate] = await Promise.all([
                prisma.request.count({
                    where: {
                        category_id: { in: catIds },
                        company_id: { not: companyId },
                        status: 'active'
                    }
                }),
                prisma.quoteResponse.count({ where: { supplier_id: companyId } }),
                prisma.transaction.count({ where: { supplier_id: companyId, status: 'completed' } }),
                prisma.transaction.aggregate({
                    _sum: { total_amount_usd: true },
                    where: { supplier_id: companyId, status: 'completed' }
                })
            ]);

            supplierStats.received_requests = solicitudesRecibidas;
            supplierStats.created_quotes = cotizacionesCreadas;
            supplierStats.generated_sales = ventasGeneradas;
            supplierStats.generated_revenue = Number(ingresosAggregate._sum.total_amount_usd || 0);
        }

        return {
            buyer_stats: buyerStats,
            supplier_stats: supplierStats
        };
    }
}
