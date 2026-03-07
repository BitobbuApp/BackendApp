// src/modules/companies/infrastructure/persistence/PrismaCompanyRepository.ts
import { CompanyRepository } from "../../domain/repositories/company.repository";
import { Company } from "../../domain/entities/company.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaCompanyRepository implements CompanyRepository {
    async create(company: Partial<Company>): Promise<Company> {
        const created = await prisma.company.create({
            data: {
                trade_name: company.trade_name!,
                legal_name: company.legal_name,
                tax_id: company.tax_id,
                founding_year: company.founding_year,
                bio: company.bio,
                logo_url: company.logo_url,
                sector: company.sector as any,
                company_type: company.company_type as any,
                interest: company.interest as any,
                approximate_volume: company.approximate_volume as any,
            }
        });

        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<Company | null> {
        const found = await prisma.company.findUnique({ where: { id } });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByTaxId(taxId: string): Promise<Company | null> {
        if (!taxId) return null;
        const found = await prisma.company.findUnique({ where: { tax_id: taxId } });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async update(id: string, company: Partial<Company>): Promise<Company> {
        const updated = await prisma.company.update({
            where: { id },
            data: {
                trade_name: company.trade_name,
                legal_name: company.legal_name,
                tax_id: company.tax_id,
                founding_year: company.founding_year,
                bio: company.bio,
                logo_url: company.logo_url,
                sector: company.sector as any,
                company_type: company.company_type as any,
                interest: company.interest as any,
                approximate_volume: company.approximate_volume as any,
                average_rating: company.average_rating,
                transaction_count: company.transaction_count,
                review_count: company.review_count,
            }
        });
        return this.mapToEntity(updated);
    }

    async list(filters?: any): Promise<Company[]> {
        const list = await prisma.company.findMany({
            where: filters,
        });
        return list.map((item: any) => this.mapToEntity(item));
    }

    private mapToEntity(db: any): Company {
        return new Company(
            db.id,
            db.trade_name,
            db.legal_name,
            db.tax_id,
            db.founding_year,
            db.bio,
            db.logo_url,
            db.sector,
            db.company_type,
            db.interest,
            db.approximate_volume,
            Number(db.average_rating),
            db.transaction_count,
            db.review_count,
            db.created_at,
            db.updated_at
        );
    }
}
