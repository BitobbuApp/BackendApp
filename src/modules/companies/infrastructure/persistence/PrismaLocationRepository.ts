import { LocationRepository } from "../../domain/repositories/location.repository";
import { CompanyLocation } from "../../domain/entities/location.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaLocationRepository implements LocationRepository {
    async create(location: Partial<CompanyLocation>): Promise<CompanyLocation> {
        const created = await prisma.companyLocation.create({
            data: {
                company_id: location.company_id!,
                state: location.state as any,
                city: location.city!,
                tax_address: location.tax_address,
                national_coverage: location.national_coverage,
                is_main_headquarters: location.is_main_headquarters,
            }
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<CompanyLocation | null> {
        const found = await prisma.companyLocation.findUnique({ where: { id } });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByCompanyId(companyId: string): Promise<CompanyLocation[]> {
        const list = await prisma.companyLocation.findMany({ where: { company_id: companyId } });
        return list.map((item: any) => this.mapToEntity(item));
    }

    async update(id: string, location: Partial<CompanyLocation>): Promise<CompanyLocation> {
        const updated = await prisma.companyLocation.update({
            where: { id },
            data: {
                state: location.state as any,
                city: location.city,
                tax_address: location.tax_address,
                national_coverage: location.national_coverage,
                is_main_headquarters: location.is_main_headquarters,
            }
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
            db.state,
            db.city,
            db.tax_address,
            db.national_coverage,
            db.is_main_headquarters
        );
    }
}
