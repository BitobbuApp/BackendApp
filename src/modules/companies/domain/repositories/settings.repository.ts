// src/modules/companies/domain/settingsRepository.ts
import { CompanySettings } from "./settingsEntity";

export interface SettingsRepository {
    findByCompanyId(companyId: string): Promise<CompanySettings | null>;
    update(companyId: string, settings: Partial<CompanySettings>): Promise<CompanySettings>;
}
