import { SettingsRepository } from "../../domain/repositories/settings.repository";
import { CompanySettings } from "../../domain/entities/settings.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaSettingsRepository implements SettingsRepository {
    async findByCompanyId(companyId: string): Promise<CompanySettings | null> {
        const found = await prisma.companySettings.findUnique({ where: { company_id: companyId } });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async update(companyId: string, settings: Partial<CompanySettings>): Promise<CompanySettings> {
        const updated = await prisma.companySettings.upsert({
            where: { company_id: companyId },
            update: {
                ...(settings.receive_email_notifications !== undefined && { email_notifications: settings.receive_email_notifications }),
                ...(settings.receive_web_notifications !== undefined && { web_notifications: settings.receive_web_notifications }),
            },
            create: {
                company_id: companyId,
                email_notifications: settings.receive_email_notifications ?? true,
                web_notifications: settings.receive_web_notifications ?? true,
            }
        });
        return this.mapToEntity(updated);
    }

    private mapToEntity(db: any): CompanySettings {
        return new CompanySettings(
            db.company_id,
            db.email_notifications,
            db.web_notifications
        );
    }
}
