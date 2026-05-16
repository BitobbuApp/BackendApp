import { DashboardRepository, DashboardStats } from "../../domain/repositories/dashboard.repository";
import { prisma } from "../../../../shared/infrastructure/database";

export class PrismaDashboardRepository implements DashboardRepository {
    async getStats(companyId: string): Promise<DashboardStats> {
        // Regla de Negocio: Filtro de 1 semana para todas las estadísticas
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

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
                prisma.request.count({ 
                    where: { 
                        company_id: companyId,
                        created_at: { gte: oneWeekAgo }
                    } 
                }),
                prisma.quoteResponse.count({ 
                    where: { 
                        request: { company_id: companyId },
                        created_at: { gte: oneWeekAgo }
                    } 
                }),
                prisma.transaction.count({ 
                    where: { 
                        buyer_id: companyId, 
                        status: 'completed',
                        created_at: { gte: oneWeekAgo }
                    } 
                })
            ]);

            buyerStats.generated_requests = solicitudesGeneradas;
            buyerStats.received_quotes = cotizacionesRecibidas;
            buyerStats.generated_purchases = comprasGeneradas;

            // --- Cálculo de Ahorro Estimado (Semanal) ---
            // Comparar precio aceptado contra el promedio de otras ofertas para ese mismo RFQ
            const acceptedQuotes = await prisma.quoteResponse.findMany({
                where: {
                    status: 'accepted',
                    request: { company_id: companyId },
                    created_at: { gte: oneWeekAgo }
                },
                select: {
                    id: true,
                    request_id: true,
                    unit_price_usd: true,
                    quantity: true
                }
            });

            let totalSavings = 0;
            for (const quote of acceptedQuotes) {
                const others = await prisma.quoteResponse.aggregate({
                    where: {
                        request_id: quote.request_id,
                        status: { not: 'accepted' },
                        id: { not: quote.id }
                    },
                    _avg: { unit_price_usd: true }
                });

                const avgOthers = Number(others._avg.unit_price_usd) || 0;
                const myPrice = Number(quote.unit_price_usd);

                // Si el promedio de las otras ofertas era mayor, calculamos el ahorro
                if (avgOthers > myPrice) {
                    totalSavings += (avgOthers - myPrice) * Number(quote.quantity);
                }
            }
            buyerStats.estimated_savings = totalSavings;
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
                        status: 'active',
                        created_at: { gte: oneWeekAgo }
                    }
                }),
                prisma.quoteResponse.count({ 
                    where: { 
                        supplier_id: companyId,
                        created_at: { gte: oneWeekAgo }
                    } 
                }),
                prisma.transaction.count({ 
                    where: { 
                        supplier_id: companyId, 
                        status: 'completed',
                        created_at: { gte: oneWeekAgo }
                    } 
                }),
                prisma.transaction.aggregate({
                    _sum: { total_amount_usd: true },
                    where: { 
                        supplier_id: companyId, 
                        status: 'completed',
                        created_at: { gte: oneWeekAgo }
                    }
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

    async getAdminKpis(): Promise<any> {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [
            total_users,
            active_users,
            pending_verifications,
            total_companies,
            rfqs_last_30_days,
            quotes_last_30_days,
            gmv_aggregate
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { is_active: true } }),
            prisma.companyVerification.count({ where: { status: 'pending' } }),
            prisma.company.count(),
            prisma.request.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
            prisma.quoteResponse.count({ where: { created_at: { gte: thirtyDaysAgo } } }),
            prisma.transaction.aggregate({
                _sum: { total_amount_usd: true },
                where: { status: 'completed' }
            })
        ]);

        return {
            total_users,
            active_users,
            pending_verifications,
            total_companies,
            rfqs_last_30_days,
            quotes_last_30_days,
            total_gmv_usd: Number(gmv_aggregate._sum.total_amount_usd || 0)
        };
    }
}
