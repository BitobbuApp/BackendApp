// src/modules/companies/domain/contactRepository.ts
import { CompanyContact } from "../entities/contact.entity";

export interface ContactRepository {
    create(contact: Partial<CompanyContact>): Promise<CompanyContact>;
    findById(id: string): Promise<CompanyContact | null>;
    findByCompanyId(companyId: string): Promise<CompanyContact[]>;
    update(id: string, contact: Partial<CompanyContact>): Promise<CompanyContact>;
    delete(id: string): Promise<void>;
    resetPrimaryContacts(companyId: string): Promise<void>;
}
