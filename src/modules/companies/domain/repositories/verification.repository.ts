// src/modules/companies/domain/verificationRepository.ts
import { CompanyVerification, VerificationDocument } from "../entities/verification.entity";

export interface VerificationRepository {
    getVerification(companyId: string): Promise<CompanyVerification | null>;
    upsertVerification(verification: Partial<CompanyVerification>): Promise<CompanyVerification>;

    addDocument(doc: Partial<VerificationDocument>): Promise<VerificationDocument>;
    getDocuments(companyId: string): Promise<VerificationDocument[]>;
    findDocumentById(id: string): Promise<VerificationDocument | null>;
    updateDocument(id: string, doc: Partial<VerificationDocument>): Promise<VerificationDocument>;
}
