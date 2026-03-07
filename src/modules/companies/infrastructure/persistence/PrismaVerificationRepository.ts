import { VerificationRepository } from "../../domain/repositories/verification.repository";
import { CompanyVerification, VerificationDocument } from "../../domain/entities/verification.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaVerificationRepository implements VerificationRepository {
    async getVerification(companyId: string): Promise<CompanyVerification | null> {
        const found = await prisma.companyVerification.findUnique({ where: { company_id: companyId } });
        if (!found) return null;
        return this.mapVerificationToEntity(found);
    }

    async upsertVerification(verification: Partial<CompanyVerification>): Promise<CompanyVerification> {
        const updated = await prisma.companyVerification.upsert({
            where: { company_id: verification.company_id! },
            update: {
                status: verification.status as any,
                last_submission_at: verification.last_submission_at,
                verified_at: verification.verified_at,
                rejected_at: verification.rejected_at,
                rejection_reason: verification.rejection_reason,
            },
            create: {
                company_id: verification.company_id!,
                status: verification.status as any || 'Pending',
                last_submission_at: verification.last_submission_at,
            }
        });
        return this.mapVerificationToEntity(updated);
    }

    async addDocument(doc: Partial<VerificationDocument>): Promise<VerificationDocument> {
        const created = await prisma.verificationDocument.create({
            data: {
                company_id: doc.company_id!,
                type: doc.type as any,
                file_url: doc.file_url!,
                status: 'Pending',
            }
        });
        return this.mapDocumentToEntity(created);
    }

    async getDocuments(companyId: string): Promise<VerificationDocument[]> {
        const list = await prisma.verificationDocument.findMany({ where: { company_id: companyId } });
        return list.map((item: any) => this.mapDocumentToEntity(item));
    }

    async findDocumentById(id: string): Promise<VerificationDocument | null> {
        const found = await prisma.verificationDocument.findUnique({ where: { id } });
        if (!found) return null;
        return this.mapDocumentToEntity(found);
    }

    async updateDocument(id: string, doc: Partial<VerificationDocument>): Promise<VerificationDocument> {
        const updated = await prisma.verificationDocument.update({
            where: { id },
            data: {
                status: doc.status as any,
                feedback: doc.feedback,
                reviewed_by: doc.reviewed_by,
                updated_at: new Date()
            }
        });
        return this.mapDocumentToEntity(updated);
    }

    private mapVerificationToEntity(db: any): CompanyVerification {
        return new CompanyVerification(
            db.company_id,
            db.status,
            db.last_submission_at,
            db.verified_at,
            db.rejected_at,
            db.rejection_reason
        );
    }

    private mapDocumentToEntity(db: any): VerificationDocument {
        return new VerificationDocument(
            db.id,
            db.company_id,
            db.type,
            db.file_url,
            db.status,
            db.feedback,
            db.reviewed_by,
            db.created_at,
            db.updated_at
        );
    }
}
