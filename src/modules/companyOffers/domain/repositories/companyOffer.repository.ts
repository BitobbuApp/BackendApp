// src/modules/companyOffers/domain/repositories/companyOffer.repository.ts
import { CompanyOffer } from "../entities/companyOffer.entity";

export interface CompanyOfferRepository {
    create(companyOffer: Partial<CompanyOffer>): Promise<CompanyOffer>;
    findById(id: string): Promise<CompanyOffer | null>;
    findByCompanyId(companyId: string): Promise<CompanyOffer[]>;
    findAllWithPagination(page: number, limit: number): Promise<{ data: CompanyOffer[], total: number }>;
    searchMarketplace(filters: any, pagination: any): Promise<{ data: CompanyOffer[], total: number, priceRange?: { min: number, max: number } }>;
    update(id: string, companyOffer: Partial<CompanyOffer>): Promise<CompanyOffer>;
    delete(id: string): Promise<void>;
}
