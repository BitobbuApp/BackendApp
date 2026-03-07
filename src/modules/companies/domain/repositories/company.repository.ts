// src/modules/companies/domain/companyRepository.ts
import { Company } from "./companyEntity";

export interface CompanyRepository {
    create(company: Partial<Company>): Promise<Company>;
    findById(id: string): Promise<Company | null>;
    findByTaxId(taxId: string): Promise<Company | null>;
    update(id: string, company: Partial<Company>): Promise<Company>;
    list(filters?: any): Promise<Company[]>;
}
