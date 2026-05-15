import { VerifDocStatus, VerificationStatus } from "@prisma/client";

export interface VerificationRepository {
    // Admin methods
    listPendingVerifications(params: { 
        page: number, 
        limit: number, 
        search?: string 
    }): Promise<{ items: any[], total: number }>;

    findDocumentsByCompanyId(companyId: string): Promise<any[]>;

    updateDocumentStatus(
        documentId: string, 
        status: VerifDocStatus, 
        reviewerId: string, 
        notes?: string
    ): Promise<any>;

    updateCompanyVerificationStatus(
        companyId: string, 
        status: VerificationStatus, 
        reason?: string
    ): Promise<void>;

    getVerificationSummary(companyId: string): Promise<{
        total_docs: number,
        approved_docs: number,
        rejected_docs: number,
        pending_docs: number
    }>;

    // User/Existing methods
    getVerification(companyId: string): Promise<any>;
    upsertVerification(data: any): Promise<any>;
    getDocuments(companyId: string): Promise<any[]>;
    updateDocument(id: string, data: any): Promise<any>;
    addDocument(data: any): Promise<any>;
}
