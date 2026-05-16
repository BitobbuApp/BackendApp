import { RequestRepository, RequestListResult } from "../../domain/repositories/request.repository";
import { RequestEntity, RequestFileEntity } from "../../domain/entities/request.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaRequestRepository implements RequestRepository {
    private buildAdminWhere(filters: any) {
        const where: any = {};

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.search) {
            where.product_service = { contains: filters.search, mode: 'insensitive' };
        }

        if (filters.serial_number) {
            where.serial_number = Number(filters.serial_number);
        }

        if (filters.from_date || filters.to_date) {
            where.created_at = {};
            if (filters.from_date) {
                where.created_at.gte = new Date(filters.from_date);
            }
            if (filters.to_date) {
                where.created_at.lte = new Date(filters.to_date);
            }
        }

        if (filters.company_id) {
            where.company_id = filters.company_id;
        }

        if (filters.category_id) {
            where.category_id = filters.category_id;
        }

        return where;
    }
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
                        locations: true,
                        transaction_count: true,
                        avg_quality: true,
                        avg_compliance_seller: true,
                        avg_communication_seller: true,
                        avg_price: true,
                        seller_review_count: true,
                        avg_compliance_buyer: true,
                        avg_reliability: true,
                        avg_communication_buyer: true,
                        buyer_review_count: true
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
            prisma.request.count({ where: { company_id: companyId, status: { notIn: ['completed', 'closed'] } } }),
            prisma.request.findMany({
                where: { company_id: companyId, status: { notIn: ['completed', 'closed'] } },
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
                    quote_responses: {
                        where: { supplier_id: excludeCompanyId },
                        select: { id: true, status: true }
                    },
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
                            transaction_count: true,
                            avg_quality: true,
                            avg_compliance_seller: true,
                            avg_communication_seller: true,
                            avg_price: true,
                            seller_review_count: true,
                            avg_compliance_buyer: true,
                            avg_reliability: true,
                            avg_communication_buyer: true,
                            buyer_review_count: true,
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

    async findAllAdmin(filters: any, page: number, limit: number): Promise<RequestListResult> {
        const skip = (page - 1) * limit;
        const where = this.buildAdminWhere(filters);

        const [total, data] = await Promise.all([
            prisma.request.count({ where }),
            prisma.request.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    unit_of_measure: true,
                    category: true,
                    company: {
                        select: {
                            id: true,
                            trade_name: true,
                            logo_url: true
                        }
                    },
                    _count: {
                        select: { quote_responses: true }
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

    async findAdminExportBatch(filters: any, limit: number, cursor?: string): Promise<RequestEntity[]> {
        const where = this.buildAdminWhere(filters);
        const data = await prisma.request.findMany({
            where,
            take: limit,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
            orderBy: { id: 'asc' },
            include: {
                unit_of_measure: true,
                category: true,
                company: {
                    select: {
                        id: true,
                        trade_name: true,
                        logo_url: true,
                    }
                },
                _count: {
                    select: { quote_responses: true }
                }
            }
        });

        return data.map((item: any) => this.mapToEntity(item));
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
                transaction_count: db.company.transaction_count ?? 0,
                avg_quality: Number(db.company.avg_quality ?? 0),
                avg_compliance_seller: Number(db.company.avg_compliance_seller ?? 0),
                avg_communication_seller: Number(db.company.avg_communication_seller ?? 0),
                avg_price: Number(db.company.avg_price ?? 0),
                seller_review_count: db.company.seller_review_count ?? 0,
                avg_compliance_buyer: Number(db.company.avg_compliance_buyer ?? 0),
                avg_reliability: Number(db.company.avg_reliability ?? 0),
                avg_communication_buyer: Number(db.company.avg_communication_buyer ?? 0),
                buyer_review_count: db.company.buyer_review_count ?? 0,
                locations: db.company.locations ?? [],
            } : null,
            files,
            db.serial_number,
            db.created_at,
            db.updated_at
        );
    }
}
