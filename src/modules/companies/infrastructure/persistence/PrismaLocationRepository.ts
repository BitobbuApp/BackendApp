import { LocationRepository } from "../../domain/repositories/location.repository";
import { CompanyLocation } from "../../domain/entities/location.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaLocationRepository implements LocationRepository {
    async create(location: Partial<CompanyLocation>): Promise<CompanyLocation> {
        const created = await prisma.companyLocation.create({
            data: {
                company: { connect: { id: location.company_id! } },
                ...(location.country_id !== undefined && location.country_id !== null
                    ? { country: { connect: { id: location.country_id } } }
                    : {}),
                ...(location.state_id !== undefined && location.state_id !== null
                    ? { state: { connect: { id: location.state_id } } }
                    : {}),
                ...(location.city_id !== undefined && location.city_id !== null
                    ? { city: { connect: { id: location.city_id } } }
                    : {}),
                tax_address: location.tax_address ?? null,
                national_coverage: location.national_coverage ?? false,
                is_main_headquarters: location.is_main_headquarters ?? true,
            },
            include: { country: true, state: true, city: true }
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<CompanyLocation | null> {
        const found = await prisma.companyLocation.findUnique({
            where: { id },
            include: { country: true, state: true, city: true }
        });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByCompanyId(companyId: string): Promise<CompanyLocation[]> {
        const list = await prisma.companyLocation.findMany({
            where: { company_id: companyId },
            include: { country: true, state: true, city: true }
        });
        return list.map((item: any) => this.mapToEntity(item));
    }

    async update(id: string, location: Partial<CompanyLocation>): Promise<CompanyLocation> {
        const updated = await prisma.companyLocation.update({
            where: { id },
            data: {
                ...(location.country_id !== undefined && {
                    country: location.country_id === null
                        ? { disconnect: true }
                        : { connect: { id: location.country_id } }
                }),
                ...(location.state_id !== undefined && {
                    state: location.state_id === null
                        ? { disconnect: true }
                        : { connect: { id: location.state_id } }
                }),
                ...(location.city_id !== undefined && {
                    city: location.city_id === null
                        ? { disconnect: true }
                        : { connect: { id: location.city_id } }
                }),
                ...(location.tax_address !== undefined && { tax_address: location.tax_address }),
                ...(location.national_coverage !== undefined && { national_coverage: location.national_coverage }),
                ...(location.is_main_headquarters !== undefined && { is_main_headquarters: location.is_main_headquarters }),
            },
            include: { country: true, state: true, city: true }
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await prisma.companyLocation.delete({ where: { id } });
    }

    async resetMainHeadquarters(companyId: string): Promise<void> {
        await prisma.companyLocation.updateMany({
            where: { company_id: companyId },
            data: { is_main_headquarters: false }
        });
    }

    private mapToEntity(db: any): CompanyLocation {
        return new CompanyLocation(
            db.id,
            db.company_id,
            db.country_id,
            db.state_id,
            db.city_id,
            db.tax_address,
            db.national_coverage,
            db.is_main_headquarters,
            db.country ? {
                id: db.country.id,
                name: db.country.name,
                iso_code: db.country.iso_code,
            } : undefined,
            db.state ? {
                id: db.state.id,
                name: db.state.name,
                code: db.state.code,
            } : undefined,
            db.city ? {
                id: db.city.id,
                name: db.city.name,
            } : undefined
        );
    }
}
