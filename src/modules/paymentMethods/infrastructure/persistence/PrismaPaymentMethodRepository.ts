import { prisma } from "../../../../shared/infrastructure/database";
import { PaymentMethod } from "../../domain/entities/paymentMethod.entity";
import { PaymentMethodRepository } from "../../domain/repositories/paymentMethod.repository";

export class PrismaPaymentMethodRepository implements PaymentMethodRepository {
    async list(): Promise<PaymentMethod[]> {
        const items = await prisma.paymentMethodDict.findMany({
            orderBy: { name_es: "asc" }
        });

        return items.map((item) => this.mapToEntity(item));
    }

    async listByCountry(countryId: number): Promise<PaymentMethod[]> {
        const items = await prisma.countryPaymentMethod.findMany({
            where: {
                country_id: countryId,
                is_active: true,
            },
            include: {
                method: true,
            },
            orderBy: {
                method: { name_es: "asc" },
            },
        });

        return items
            .filter((item) => item.method.is_active)
            .map((item) => this.mapToEntity(item.method));
    }

    private mapToEntity(db: any): PaymentMethod {
        return new PaymentMethod(
            db.id,
            db.name_en,
            db.name_es,
            db.is_active
        );
    }
}
