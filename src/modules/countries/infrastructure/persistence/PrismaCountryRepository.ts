import { prisma } from "../../../../shared/infrastructure/database";
import { Country } from "../../domain/entities/country.entity";
import { CountryRepository } from "../../domain/repositories/country.repository";

export class PrismaCountryRepository implements CountryRepository {
    async list(): Promise<Country[]> {
        const items = await prisma.country.findMany({
            where: { is_active: true },
            orderBy: { name_es: "asc" },
        });

        return items.map((item) => this.mapToEntity(item));
    }

    async findAll(): Promise<Country[]> {
        const items = await prisma.country.findMany({
            orderBy: { id: "asc" },
        });

        return items.map((item) => this.mapToEntity(item));
    }

    async findById(id: number): Promise<Country | null> {
        const item = await prisma.country.findUnique({
            where: { id }
        });
        if (!item) return null;
        return this.mapToEntity(item);
    }

    async create(data: Partial<Country>): Promise<Country> {
        const item = await prisma.country.create({
            data: data as any
        });
        return this.mapToEntity(item);
    }

    async update(id: number, data: Partial<Country>): Promise<Country> {
        const item = await prisma.country.update({
            where: { id },
            data: data as any
        });
        return this.mapToEntity(item);
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
