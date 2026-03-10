import { RequestRepository, RequestListResult } from "../../domain/repositories/request.repository";
import { RequestEntity, RequestFileEntity } from "../../domain/entities/request.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaRequestRepository implements RequestRepository {
    async create(request: Partial<RequestEntity>): Promise<RequestEntity> {
        const dataPayload: any = {
            company_id: request.company_id!,
            product_service: request.product_service!,
            quantity: request.quantity!,
            user_id: request.user_id ?? null,
            unit_of_measure: (request.unit_of_measure as any) ?? 'Units',
            description: request.description ?? null,
            category: (request.category as any) ?? null,
            status: (request.status as any) ?? 'Active',
            expiration_date: request.expiration_date ?? null,
        };

        if (request.files && request.files.length > 0) {
            dataPayload.files = {
                create: request.files.map(f => ({
                    url: f.url,
                    file_name: f.file_name ?? null
                }))
            };
        }

        const created = await prisma.request.create({
            data: dataPayload,
            include: { files: true }
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<RequestEntity | null> {
        const found = await prisma.request.findUnique({
            where: { id },
            include: { files: true }
        });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByCompanyId(companyId: string, page: number, limit: number): Promise<RequestListResult> {
        const skip = (page - 1) * limit;

        const [total, data] = await Promise.all([
            prisma.request.count({ where: { company_id: companyId } }),
            prisma.request.findMany({
                where: { company_id: companyId },
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: { files: true }
            })
        ]);

        return {
            data: data.map((item: any) => this.mapToEntity(item)),
            total,
            page,
            limit
        };
    }

    async findExcludingCompany(excludeCompanyId: string, page: number, limit: number): Promise<RequestListResult> {
        const skip = (page - 1) * limit;
        const where = {
            company_id: { not: excludeCompanyId },
            status: 'Active' as any,
        };

        const [total, data] = await Promise.all([
            prisma.request.count({ where }),
            prisma.request.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    files: true,
                    company: {
                        select: {
                            id: true,
                            trade_name: true,
                            logo_url: true,
                            sector: true,
                            average_rating: true,
                        }
                    }
                }
            })
        ]);

        return {
            data: data.map((item: any) => this.mapToEntity(item)),
            total,
            page,
            limit,
            _raw: data
        };
    }

    async update(id: string, request: Partial<RequestEntity>): Promise<RequestEntity> {
        const updated = await prisma.request.update({
            where: { id },
            data: {
                ...(request.product_service !== undefined && { product_service: request.product_service }),
                ...(request.quantity !== undefined && { quantity: request.quantity }),
                ...(request.user_id !== undefined && { user_id: request.user_id }),
                ...(request.unit_of_measure !== undefined && { unit_of_measure: request.unit_of_measure as any }),
                ...(request.description !== undefined && { description: request.description }),
                ...(request.category !== undefined && { category: request.category as any }),
                ...(request.status !== undefined && { status: request.status as any }),
                ...(request.expiration_date !== undefined && { expiration_date: request.expiration_date }),
            }
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await prisma.request.delete({ where: { id } });
    }

    private mapToEntity(db: any): RequestEntity {
        const files: RequestFileEntity[] = db.files ? db.files.map((f: any) => ({
            id: f.id,
            request_id: f.request_id,
            url: f.url,
            file_name: f.file_name,
            created_at: f.created_at
        })) : [];

        return new RequestEntity(
            db.id,
            db.company_id,
            db.product_service,
            Number(db.quantity),
            db.user_id,
            db.unit_of_measure,
            db.description,
            db.category,
            db.status,
            db.expiration_date,
            db.response_count,
            files,
            db.created_at,
            db.updated_at
        );
    }
}
