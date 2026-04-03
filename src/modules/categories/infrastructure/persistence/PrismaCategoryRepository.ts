import { prisma } from "../../../../shared/infrastructure/database";
import { Category } from "../../domain/entities/category.entity";
import { CategoryRepository } from "../../domain/repositories/category.repository";

export class PrismaCategoryRepository implements CategoryRepository {
    async list(): Promise<Category[]> {
        const items = await prisma.category.findMany({
            orderBy: { name_es: "asc" }
        });

        return items.map((item) => this.mapToEntity(item));
    }

    private mapToEntity(db: any): Category {
        return new Category(
            db.id,
            db.name_en,
            db.name_es,
            db.slug,
            db.icon ?? null,
            db.is_active
        );
    }
}
