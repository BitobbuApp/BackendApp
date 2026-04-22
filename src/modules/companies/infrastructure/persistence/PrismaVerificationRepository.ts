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
                status: verification.status as any || 'pending',
            }
        });
        return this.mapVerificationToEntity(updated);
    }

    async addDocument(doc: Partial<VerificationDocument>): Promise<VerificationDocument> {
        const created = await prisma.verificationDocument.create({
            data: {
                company_id: doc.company_id!,
                type_id: (doc as any).type_id!,
                url: doc.file_url!,
                status: 'pending',
            } as any,
            include: { type: true }
        });
        return this.mapDocumentToEntity(created);
    }

    async getDocuments(companyId: string): Promise<VerificationDocument[]> {
        const list = await prisma.verificationDocument.findMany({
            where: { company_id: companyId },
            include: { type: true }
        });
        return list.map((item: any) => this.mapDocumentToEntity(item));
    }

    async findDocumentById(id: string): Promise<VerificationDocument | null> {
        const found = await prisma.verificationDocument.findUnique({ where: { id }, include: { type: true } });
        if (!found) return null;
        return this.mapDocumentToEntity(found);
    }

    async updateDocument(id: string, doc: Partial<VerificationDocument>): Promise<VerificationDocument> {
        const dataToUpdate: any = {};
        if (doc.status !== undefined) dataToUpdate.status = doc.status;
        if (doc.feedback !== undefined) dataToUpdate.notes = doc.feedback;
        if (doc.reviewed_by !== undefined) dataToUpdate.reviewed_by = doc.reviewed_by;
        if (doc.file_url !== undefined) dataToUpdate.url = doc.file_url;
        
        if (doc.status === 'approved' || doc.status === 'rejected') {
            dataToUpdate.reviewed_at = new Date();
        } else if (doc.status === 'pending') {
            dataToUpdate.reviewed_at = null;
        }

        const updated = await prisma.verificationDocument.update({
            where: { id },
            data: dataToUpdate,
            include: { type: true }
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
            db.type_id,
            db.type?.name_es ?? db.type?.name_en ?? '',
            db.url,
            db.status,
            db.notes,
            db.reviewed_by,
            db.created_at,
            db.reviewed_at
        );
    }
}
