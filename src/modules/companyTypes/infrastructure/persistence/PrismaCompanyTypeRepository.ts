import { prisma } from "../../../../shared/infrastructure/database";
import { CompanyType } from "../../domain/entities/companyType.entity";
import { CompanyTypeRepository } from "../../domain/repositories/companyType.repository";

export class PrismaCompanyTypeRepository implements CompanyTypeRepository {
    async list(): Promise<CompanyType[]> {
        const items = await prisma.companyTypeDict.findMany({
            where: { is_active: true },
            orderBy: { name_es: "asc" }
        });

        return items.map((item) => this.mapToEntity(item));
    }

    private mapToEntity(db: any): CompanyType {
        return new CompanyType(
            db.id,
            db.name_en,
            db.name_es,
            db.is_active,
            db.description ?? null
        );
    }
}
