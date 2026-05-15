import { DeliveryMethodRepository } from "../../domain/repositories/deliveryMethod.repository";
import { DeliveryMethodEntity } from "../../domain/entities/deliveryMethod.entity";
import { prisma } from "../../../../shared/infrastructure/database";

export class PrismaDeliveryMethodRepository implements DeliveryMethodRepository {
    async list(countryId?: number): Promise<DeliveryMethodEntity[]> {
        const models = await prisma.deliveryMethod.findMany({
            where: {
                ...(countryId !== undefined && { country_id: countryId }),
            },
            orderBy: [
                { country_id: 'asc' },
                { name: 'asc' },
            ],
        });

        return models.map(m => new DeliveryMethodEntity(
            m.id,
            m.country_id,
            m.name,
            m.is_active
        ));
    }

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

    async findById(id: string): Promise<DeliveryMethodEntity | null> {
        const model = await prisma.deliveryMethod.findUnique({ where: { id } });
        if (!model) {
            return null;
        }

        return new DeliveryMethodEntity(
            model.id,
            model.country_id,
            model.name,
            model.is_active
        );
    }

    async create(data: Partial<DeliveryMethodEntity>): Promise<DeliveryMethodEntity> {
        const created = await prisma.deliveryMethod.create({
            data: {
                country_id: data.country_id!,
                name: data.name!,
                is_active: data.is_active ?? true,
            }
        });

        return new DeliveryMethodEntity(
            created.id,
            created.country_id,
            created.name,
            created.is_active
        );
    }

    async update(id: string, data: Partial<DeliveryMethodEntity>): Promise<DeliveryMethodEntity> {
        const updated = await prisma.deliveryMethod.update({
            where: { id },
            data: {
                ...(data.country_id !== undefined && { country_id: data.country_id }),
                ...(data.name !== undefined && { name: data.name }),
                ...(data.is_active !== undefined && { is_active: data.is_active }),
            }
        });

        return new DeliveryMethodEntity(
            updated.id,
            updated.country_id,
            updated.name,
            updated.is_active
        );
    }

    async updateStatus(id: string, isActive: boolean): Promise<DeliveryMethodEntity> {
        const updated = await prisma.deliveryMethod.update({
            where: { id },
            data: { is_active: isActive }
        });

        return new DeliveryMethodEntity(
            updated.id,
            updated.country_id,
            updated.name,
            updated.is_active
        );
    }
}
