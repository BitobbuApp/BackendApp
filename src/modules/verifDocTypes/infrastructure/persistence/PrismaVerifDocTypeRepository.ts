import { prisma } from "../../../../shared/infrastructure/database";
import { VerifDocType } from "../../domain/entities/verifDocType.entity";
import { VerifDocTypeRepository } from "../../domain/repositories/verifDocType.repository";

export class PrismaVerifDocTypeRepository implements VerifDocTypeRepository {
    async list(): Promise<VerifDocType[]> {
        const items = await prisma.verifDocTypeDict.findMany({
            where: { is_active: true },
            orderBy: { name_es: "asc" }
        });

        return items.map((item) => this.mapToEntity(item));
    }

    private mapToEntity(db: any): VerifDocType {
        return new VerifDocType(
            db.id,
            db.name_en,
            db.name_es ?? null,
            db.is_active,
            db.instructions ?? null
        );
    }
}
