import { DeliveryMethodRepository } from "../../domain/repositories/deliveryMethod.repository";
import { DeliveryMethodEntity } from "../../domain/entities/deliveryMethod.entity";
import { prisma } from "../../../../shared/infrastructure/database";

export class PrismaDeliveryMethodRepository implements DeliveryMethodRepository {
    async findByCountryId(countryId: number): Promise<DeliveryMethodEntity[]> {
        const models = await prisma.deliveryMethod.findMany({
            where: { country_id: countryId, is_active: true },
            orderBy: { name: 'asc' }
        });
        
        return models.map(m => new DeliveryMethodEntity(
            m.id,
            m.country_id,
            m.name,
            m.is_active
        ));
    }
}
