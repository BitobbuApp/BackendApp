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
                ...(verification.verified_at !== undefined && { verified_at: verification.verified_at }),
                ...(verification.rejection_reason !== undefined && { rejection_reason: verification.rejection_reason }),
            },
            create: {
                company_id: verification.company_id!,
                status: verification.status as any || 'Pending',
            }
        });
        return this.mapVerificationToEntity(updated);
    }

    async addDocument(doc: Partial<VerificationDocument>): Promise<VerificationDocument> {
        const created = await prisma.verificationDocument.create({
            data: {
                company_id: doc.company_id!,
                type: doc.type as any,
                url: doc.file_url!,
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
                ...(doc.status !== undefined && { status: doc.status as any }),
                ...(doc.feedback !== undefined && { notes: doc.feedback }),
                ...(doc.reviewed_by !== undefined && { reviewed_by: doc.reviewed_by }),
                reviewed_at: new Date()
            }
        });
        return this.mapDocumentToEntity(updated);
    }

    private mapVerificationToEntity(db: any): CompanyVerification {
        return new CompanyVerification(
            db.company_id,
            db.status,
            null, // last_submission_at not in Prisma schema
            db.verified_at,
            null, // rejected_at not in Prisma schema
            db.rejection_reason
        );
    }

    private mapDocumentToEntity(db: any): VerificationDocument {
        return new VerificationDocument(
            db.id,
            db.company_id,
            db.type,
            db.url,
            db.status,
            db.notes,
            db.reviewed_by,
            db.created_at,
            db.reviewed_at
        );
    }
}
