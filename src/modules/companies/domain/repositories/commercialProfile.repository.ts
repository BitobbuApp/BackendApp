// src/modules/companies/domain/commercialProfileRepository.ts
import { CommercialProfile } from "./commercialProfileEntity";

export interface CommercialProfileRepository {
    findByCompanyId(companyId: string): Promise<CommercialProfile | null>;
    update(companyId: string, profile: Partial<CommercialProfile>): Promise<CommercialProfile>;
}
