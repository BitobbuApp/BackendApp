import { prisma } from "../../../../shared/infrastructure/database";
import { UnitOfMeasure } from "../../domain/entities/unitOfMeasure.entity";
import { UnitOfMeasureRepository } from "../../domain/repositories/unitOfMeasure.repository";

export class PrismaUnitOfMeasureRepository implements UnitOfMeasureRepository {
    async list(): Promise<UnitOfMeasure[]> {
        const items = await prisma.unitOfMeasureDict.findMany({
            orderBy: { name_es: "asc" }
        });

        return items.map((item) => this.mapToEntity(item));
    }

    private mapToEntity(db: any): UnitOfMeasure {
        return new UnitOfMeasure(
            db.id,
            db.name_en,
            db.name_es ?? null,
            db.abbreviation
        );
    }
}
