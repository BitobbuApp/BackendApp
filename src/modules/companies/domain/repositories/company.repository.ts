// src/modules/companies/domain/companyRepository.ts
import { Company } from "../entities/company.entity";

export interface CompanyListResult {
    data: Company[];
    total: number;
    page: number;
    limit: number;
    _raw?: any[];
}

export interface CompanyRepository {
    create(company: Partial<Company>): Promise<Company>;
    findById(id: string): Promise<Company | null>;
    findByTaxId(taxId: string): Promise<Company | null>;
    update(id: string, company: Partial<Company>): Promise<Company>;
    list(filters?: any, page?: number, limit?: number): Promise<CompanyListResult>;
}
