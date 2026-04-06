import { prisma } from "../../../../shared/infrastructure/database";
import { EstimatedMonthlyTransaction } from "../../domain/entities/estimatedMonthlyTransaction.entity";
import { EstimatedMonthlyTransactionRepository } from "../../domain/repositories/estimatedMonthlyTransaction.repository";

export class PrismaEstimatedMonthlyTransactionRepository implements EstimatedMonthlyTransactionRepository {
    async list(): Promise<EstimatedMonthlyTransaction[]> {
        const items = await prisma.estimatedMonthlyTransaction.findMany({
            orderBy: { range_name: "asc" },
        });
        return items.map((item) => this.mapToEntity(item));
    }

    private mapToEntity(db: any): EstimatedMonthlyTransaction {
        return new EstimatedMonthlyTransaction(
            db.id,
            db.range_name,
            db.description,
            db.description_es,
        );
    }
}
