// src/modules/companies/domain/locationRepository.ts
import { CompanyLocation } from "./locationEntity";

export interface LocationRepository {
    create(location: Partial<CompanyLocation>): Promise<CompanyLocation>;
    findById(id: string): Promise<CompanyLocation | null>;
    findByCompanyId(companyId: string): Promise<CompanyLocation[]>;
    update(id: string, location: Partial<CompanyLocation>): Promise<CompanyLocation>;
    delete(id: string): Promise<void>;
    resetMainHeadquarters(companyId: string): Promise<void>;
}
