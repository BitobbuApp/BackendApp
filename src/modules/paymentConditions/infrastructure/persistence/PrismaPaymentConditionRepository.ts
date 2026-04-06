import { prisma } from "../../../../shared/infrastructure/database";
import { PaymentCondition } from "../../domain/entities/paymentCondition.entity";
import { PaymentConditionRepository } from "../../domain/repositories/paymentCondition.repository";

export class PrismaPaymentConditionRepository implements PaymentConditionRepository {
    async list(): Promise<PaymentCondition[]> {
        const items = await prisma.paymentCondition.findMany({
            where: { is_active: true },
            orderBy: { days_to_due: "asc" },
        });
        return items.map((item) => this.mapToEntity(item));
    }

    private mapToEntity(db: any): PaymentCondition {
        return new PaymentCondition(
            db.id,
            db.name_en,
            db.name_es,
            db.days_to_due,
            db.description,
            db.is_active,
        );
    }
}
