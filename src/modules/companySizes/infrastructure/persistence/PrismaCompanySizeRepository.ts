import { prisma } from "../../../../shared/infrastructure/database";
import { CompanySize } from "../../domain/entities/companySize.entity";
import { CompanySizeRepository } from "../../domain/repositories/companySize.repository";

export class PrismaCompanySizeRepository implements CompanySizeRepository {
    async list(): Promise<CompanySize[]> {
        const items = await prisma.companySize.findMany({
            where: { is_active: true },
            orderBy: { size_name: "asc" },
        });
        return items.map((item) => this.mapToEntity(item));
    }

    private mapToEntity(db: any): CompanySize {
        return new CompanySize(
            db.id,
            db.size_name,
            db.display_label,
            db.display_label_es,
            db.is_active,
        );
    }
}
