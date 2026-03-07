import { CommercialProfileRepository } from "../../domain/repositories/commercialProfile.repository";
import { CommercialProfile } from "../../domain/entities/commercialProfile.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaCommercialProfileRepository implements CommercialProfileRepository {
    async findByCompanyId(companyId: string): Promise<CommercialProfile | null> {
        const found = await prisma.companyCommercialProfile.findUnique({ where: { company_id: companyId } });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async update(companyId: string, profile: Partial<CommercialProfile>): Promise<CommercialProfile> {
        const updated = await prisma.companyCommercialProfile.upsert({
            where: { company_id: companyId },
            update: {
                is_withholding_agent: profile.is_withholding_agent,
                works_with_credit: profile.works_with_credit,
            },
            create: {
                company_id: companyId,
                is_withholding_agent: profile.is_withholding_agent ?? false,
                works_with_credit: profile.works_with_credit ?? false,
            }
        });
        return this.mapToEntity(updated);
    }

    private mapToEntity(db: any): CommercialProfile {
        return new CommercialProfile(
            db.company_id,
            db.is_withholding_agent,
            db.works_with_credit
        );
    }
}
