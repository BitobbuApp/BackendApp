import { prisma } from "../../../../shared/infrastructure/database";
import { UserOnboardingStatus } from "../../domain/entities/userOnboardingStatus.entity";
import { UserOnboardingStatusRepository } from "../../domain/repositories/userOnboardingStatus.repository";

export class PrismaUserOnboardingStatusRepository implements UserOnboardingStatusRepository {
    async findByUserAndCompany(userId: string, companyId: string): Promise<UserOnboardingStatus[]> {
        const items = await prisma.userOnboardingStatus.findMany({
            where: { user_id: userId, company_id: companyId },
            orderBy: { module_name: "asc" },
        });
        return items.map((item) => this.mapToEntity(item));
    }

    async upsertModule(userId: string, companyId: string, moduleName: string): Promise<UserOnboardingStatus> {
        const result = await prisma.userOnboardingStatus.upsert({
            where: {
                user_id_company_id_module_name: {
                    user_id: userId,
                    company_id: companyId,
                    module_name: moduleName,
                },
            },
            create: {
                user_id: userId,
                company_id: companyId,
                module_name: moduleName,
                has_completed_tutorial: true,
            },
            update: {
                has_completed_tutorial: true,
                updated_at: new Date(),
            },
        });
        return this.mapToEntity(result);
    }

    private mapToEntity(db: any): UserOnboardingStatus {
        return new UserOnboardingStatus(
            db.id,
            db.user_id,
            db.company_id,
            db.module_name,
            db.has_completed_tutorial,
            db.created_at,
            db.updated_at,
        );
    }
}
