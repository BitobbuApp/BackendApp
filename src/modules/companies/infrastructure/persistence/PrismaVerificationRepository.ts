import { VerificationRepository } from "../../domain/repositories/verification.repository";
import { prisma } from "../../../../shared/infrastructure/database";
import { VerifDocStatus, VerificationStatus } from "@prisma/client";

export class PrismaVerificationRepository implements VerificationRepository {
    async listPendingVerifications(params: { page: number, limit: number, search?: string }): Promise<{ items: any[], total: number }> {
        const { page, limit, search } = params;
        const skip = (page - 1) * limit;

        const where: any = {
            OR: [
                { verification: null },
                { verification: { status: { in: ['pending', 'under_review', 'rejected'] } } }
            ]
        };

        if (search) {
            const searchCondition = {
                OR: [
                    { trade_name: { contains: search, mode: 'insensitive' } },
                    { legal_name: { contains: search, mode: 'insensitive' } },
                    { tax_id: { contains: search, mode: 'insensitive' } },
                ]
            };
            // Combine with existing where
            where.AND = [searchCondition];
        }

        const [items, total] = await Promise.all([
            prisma.company.findMany({
                where,
                skip,
                take: limit,
                orderBy: { updated_at: 'desc' },
                include: {
                    verification: true,
                    _count: {
                        select: { verif_documents: true }
                    }
                }
            }),
            prisma.company.count({ where })
        ]);

        return {
            items: items.map(item => ({
                company_id: item.id,
                trade_name: item.trade_name,
                legal_name: item.legal_name,
                tax_id: item.tax_id,
                status: (item as any).verification?.status || 'pending',
                document_count: (item as any)._count.verif_documents,
                updated_at: item.updated_at
            })),
            total
        };
    }

    async findDocumentsByCompanyId(companyId: string): Promise<any[]> {
        return await prisma.verificationDocument.findMany({
            where: { company_id: companyId },
            include: { type: true },
            orderBy: { created_at: 'asc' }
        });
    }

    async updateDocumentStatus(documentId: string, status: VerifDocStatus, reviewerId: string, notes?: string): Promise<any> {
        return await prisma.verificationDocument.update({
            where: { id: documentId },
            data: {
                status,
                reviewed_by: reviewerId,
                reviewed_at: new Date(),
                notes: notes || null
            }
        });
    }

    async updateCompanyVerificationStatus(companyId: string, status: VerificationStatus, reason?: string): Promise<void> {
        await prisma.companyVerification.upsert({
            where: { company_id: companyId },
            update: {
                status,
                rejection_reason: reason || null,
                verified_at: status === 'verified' ? new Date() : null,
                updated_at: new Date()
            },
            create: {
                company_id: companyId,
                status,
                rejection_reason: reason || null,
                verified_at: status === 'verified' ? new Date() : null
            }
        });
    }

    async getVerificationSummary(companyId: string): Promise<{ total_docs: number; approved_docs: number; rejected_docs: number; pending_docs: number; }> {
        const docs = await prisma.verificationDocument.findMany({
            where: { company_id: companyId }
        });

        return {
            total_docs: docs.length,
            approved_docs: docs.filter((d: any) => d.status === 'approved').length,
            rejected_docs: docs.filter((d: any) => d.status === 'rejected').length,
            pending_docs: docs.filter((d: any) => d.status === 'pending').length
        };
    }

    // User/Existing methods
    async getVerification(companyId: string): Promise<any> {
        return await prisma.companyVerification.findUnique({
            where: { company_id: companyId }
        });
    }

    async upsertVerification(data: any): Promise<any> {
        return await prisma.companyVerification.upsert({
            where: { company_id: data.company_id },
            update: {
                status: data.status,
                updated_at: new Date()
            },
            create: {
                company_id: data.company_id,
                status: data.status
            }
        });
    }

    async getDocuments(companyId: string): Promise<any[]> {
        return await prisma.verificationDocument.findMany({
            where: { company_id: companyId }
        });
    }

    async addDocument(data: any): Promise<any> {
        return await prisma.verificationDocument.create({
            data: {
                company_id: data.company_id,
                type_id: data.type_id,
                url: data.file_url,
                status: 'pending'
            }
        });
    }

    async updateDocument(id: string, data: any): Promise<any> {
        return await prisma.verificationDocument.update({
            where: { id },
            data: {
                url: data.file_url,
                status: data.status,
                notes: data.feedback || null,
                reviewed_by: data.reviewed_by || null,
                reviewed_at: data.reviewed_at || null
            }
        });
    }
}
