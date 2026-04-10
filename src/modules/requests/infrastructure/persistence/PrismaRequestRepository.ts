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
            unit_id: (request as any).unit_id ?? 1,
            description: request.description ?? null,
            ...( (request as any).category_id !== undefined ? { category_id: (request as any).category_id } : {}),
            status: (request.status as any) ?? 'active',
            type: (request as any).type ?? 'product',
            expiration_date: request.expiration_date ?? null,
            payment_condition_id: (request as any).payment_condition_id ?? null,
            country_id: (request as any).country_id ?? null,
            state_id: (request as any).state_id ?? null,
            city_id: (request as any).city_id ?? null,
            reach_service: (request as any).reach_service ?? null,
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
            include: { files: true, unit_of_measure: true, category: true }
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<RequestEntity | null> {
        const found = await prisma.request.findUnique({
            where: { id },
            include: {
                files: true,
                unit_of_measure: true,
                category: true,
                company: {
                    select: {
                        id: true,
                        trade_name: true,
                        logo_url: true,
                        average_rating: true,
                        review_count: true,
                        bio: true,
                        sector_ref: true,
                        company_type_ref: true,
                        locations: true
                    }
                }
            }
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
                include: { files: true, unit_of_measure: true, category: true }
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
            status: 'active' as any,
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
                    unit_of_measure: true,
                    category: true,
                    company: {
                        select: {
                            id: true,
                            trade_name: true,
                            logo_url: true,
                            sector_ref: true,
                            average_rating: true,
                            review_count: true,
                            bio: true,
                            company_type_ref: true,
                            locations: true,
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
                ...( (request as any).unit_id !== undefined && { unit_id: (request as any).unit_id }),
                ...(request.description !== undefined && { description: request.description }),
                ...( (request as any).category_id !== undefined && { category_id: (request as any).category_id }),
                ...(request.status !== undefined && { status: request.status as any }),
                ...( (request as any).type !== undefined && { type: (request as any).type as any }),
                ...(request.expiration_date !== undefined && { expiration_date: request.expiration_date }),
                ...( (request as any).payment_condition_id !== undefined && {
                    payment_condition: (request as any).payment_condition_id === null
                        ? { disconnect: true }
                        : { connect: { id: (request as any).payment_condition_id } }
                }),
                ...( (request as any).country_id !== undefined && { country_id: (request as any).country_id }),
                ...( (request as any).state_id !== undefined && { state_id: (request as any).state_id }),
                ...( (request as any).city_id !== undefined && { city_id: (request as any).city_id }),
                ...( (request as any).reach_service !== undefined && { reach_service: (request as any).reach_service }),
            } as any,
            include: { files: true, unit_of_measure: true, category: true }
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
            db.unit_id,
            db.unit_of_measure?.name_es ?? db.unit_of_measure?.name_en ?? db.unit_of_measure?.abbreviation ?? 'Units',
            db.description,
            db.category_id,
            db.category?.name_es ?? null,
            db.status,
            db.type,
            db.expiration_date,
            db.response_count,
            db.payment_condition_id ?? null,
            db.country_id ?? null,
            db.state_id ?? null,
            db.city_id ?? null,
            db.reach_service ?? null,
            db.company ? {
                id: db.company.id,
                trade_name: db.company.trade_name,
                logo_url: db.company.logo_url ?? null,
                average_rating: db.company.average_rating != null
                    ? Number(db.company.average_rating)
                    : null,
                bio: db.company.bio ?? null,
                sector: db.company.sector_ref?.name_es ?? null,
                company_type: db.company.company_type_ref?.name_es ?? null,
                review_count: db.company.review_count ?? 0,
                locations: db.company.locations ?? [],
            } : null,
            files,
            db.created_at,
            db.updated_at
        );
    }
}
