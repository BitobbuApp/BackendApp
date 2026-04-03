import { prisma } from "../../../../shared/infrastructure/database";
import { Country } from "../../domain/entities/country.entity";
import { CountryRepository } from "../../domain/repositories/country.repository";

export class PrismaCountryRepository implements CountryRepository {
    async list(): Promise<Country[]> {
        const items = await prisma.country.findMany({
            orderBy: { id: "asc" },
        });

        return items.map((item) => this.mapToEntity(item));
    }

    private mapToEntity(db: any): Country {
        return new Country(
            db.id,
            db.name_es ?? db.name,
            db.name_en ?? db.name,
            db.iso_code,
            db.phone_code ?? null,
            db.is_active ?? true,
        );
    }
}
