import { prisma } from "../../../../shared/infrastructure/database";
import { CityEntity } from "../../domain/entities/city.entity";
import { CityRepository } from "../../domain/repositories/city.repository";

export class PrismaCityRepository implements CityRepository {
    async list(stateId?: number): Promise<CityEntity[]> {
        const items = await prisma.city.findMany({
            where: {
                ...(stateId !== undefined && { state_id: stateId }),
            },
            include: {
                state: true,
            },
            orderBy: [
                { state_id: 'asc' },
                { name: 'asc' },
            ],
        });

        return items.map((item) => this.mapToEntity(item));
    }

    async findById(id: number): Promise<CityEntity | null> {
        const item = await prisma.city.findUnique({
            where: { id },
            include: { state: true },
        });

        return item ? this.mapToEntity(item) : null;
    }

    async create(data: Partial<CityEntity>): Promise<CityEntity> {
        const created = await prisma.city.create({
            data: {
                state_id: data.state_id!,
                name: data.name!,
            },
            include: { state: true },
        });

        return this.mapToEntity(created);
    }

    async update(id: number, data: Partial<CityEntity>): Promise<CityEntity> {
        const updated = await prisma.city.update({
            where: { id },
            data: {
                ...(data.state_id !== undefined && { state_id: data.state_id }),
                ...(data.name !== undefined && { name: data.name }),
            },
            include: { state: true },
        });

        return this.mapToEntity(updated);
    }

    private mapToEntity(db: any): CityEntity {
        return new CityEntity(
            db.id,
            db.state_id,
            db.name,
            db.state?.name ?? null,
        );
    }
}
