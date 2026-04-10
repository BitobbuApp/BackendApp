import { QuoteResponseRepository, PaginatedResult } from "../../domain/repositories/quote_response.repository";
import { QuoteResponse, ResponseStatus } from "../../domain/entities/quote_response.entity";
import { prisma } from '../../../../shared/infrastructure/database';
import { Prisma } from "@prisma/client";
import { DuplicateQuoteResponseError } from "../../domain/errors/quote_response.errors";

export class PrismaQuoteResponseRepository implements QuoteResponseRepository {
    async create(response: Partial<QuoteResponse>): Promise<QuoteResponse> {
        try {
            const created = await prisma.$transaction(async (tx) => {
                // 1. Create the quote response
                const newResponse = await tx.quoteResponse.create({
                    data: {
                        request_id: response.request_id!,
                        supplier_id: response.supplier_id!,
                        company_offer_id: response.company_offer_id ?? null,
                        unit_price_usd: new Prisma.Decimal(response.unit_price_usd!),
                        quantity: new Prisma.Decimal(response.quantity!),
                        payment_conditions: response.payment_conditions ?? null,
                        payment_condition_id: (response as any).payment_condition_id ?? null,
                        delivery_method_id: (response as any).delivery_method_id ?? null,
                        delivery_time: response.delivery_time ?? null,
                        notes: response.notes ?? null,
                        has_guarantee: response.has_guarantee ?? false,
                        status: (response.status as any) ?? 'pending',
                        rejection_reason: response.rejection_reason ?? null,
                        total_amount_usd: new Prisma.Decimal(response.unit_price_usd! * response.quantity!),
                        payment_currency: (response as any).payment_currency ?? 'USD',
                        exchange_rate_id: (response as any).exchange_rate_id ?? null,
                    }
                });

                // 2. Atomically increment response_count on the parent Request
                await tx.request.update({
                    where: { id: response.request_id! },
                    data: { response_count: { increment: 1 } }
                });

                return newResponse;
            });

            return this.mapToEntity(created);
        } catch (error: any) {
            // Check for Prisma unique constraint violation code
            if (error.code === 'P2002') {
                throw new DuplicateQuoteResponseError(response.request_id!, response.supplier_id!);
            }
            throw error;
        }
    }

    async findById(id: string): Promise<QuoteResponse | null> {
        const found = await prisma.quoteResponse.findUnique({ where: { id } });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findBySupplierId(supplierId: string, page: number, limit: number): Promise<PaginatedResult<QuoteResponse>> {
        const skip = (page - 1) * limit;

        const [total, items] = await Promise.all([
            prisma.quoteResponse.count({ where: { supplier_id: supplierId } }),
            prisma.quoteResponse.findMany({
                where: { supplier_id: supplierId },
                skip,
                take: limit,
                orderBy: { created_at: 'desc' }
            })
        ]);

        return {
            items: items.map((item: Prisma.QuoteResponseGetPayload<{}>) => this.mapToEntity(item)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findByRequestId(requestId: string, page: number, limit: number): Promise<PaginatedResult<any>> {
        const skip = (page - 1) * limit;
        const where = { request_id: requestId };

        const [total, items] = await Promise.all([
            prisma.quoteResponse.count({ where }),
            prisma.quoteResponse.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    supplier: {
                        select: {
                            id: true,
                            trade_name: true,
                            logo_url: true,
                            company_type_ref: true,
                            sector_ref: true,
                            average_rating: true,
                        }
                    }
                }
            })
        ]);

        return {
            items: items.map((item: any) => ({
                id: item.id,
                request_id: item.request_id,
                supplier_id: item.supplier_id,
                unit_price_usd: Number(item.unit_price_usd),
                quantity: Number(item.quantity),
                total_amount_usd: Number(item.total_amount_usd),
                payment_conditions: item.payment_conditions,
                payment_condition_id: item.payment_condition_id,
                delivery_time: item.delivery_time,
                notes: item.notes,
                status: item.status,
                created_at: item.created_at,
                updated_at: item.updated_at,
                supplier: {
                    ...item.supplier,
                    company_type: item.supplier?.company_type_ref?.name ?? null,
                    sector: item.supplier?.sector_ref?.name ?? null,
                    average_rating: item.supplier?.average_rating ? Number(item.supplier.average_rating) : 0,
                    name: item.supplier?.trade_name, // Mapping to match frontend expectations
                    initial: item.supplier?.trade_name?.[0]?.toUpperCase() || 'S'
                }
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async findByRequestOwnerId(companyId: string, page: number, limit: number): Promise<PaginatedResult<any>> {
        const skip = (page - 1) * limit;
        const where = {
            request: { company_id: companyId }
        };

        const [total, items] = await Promise.all([
            prisma.quoteResponse.count({ where }),
            prisma.quoteResponse.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    supplier: {
                        select: {
                            id: true,
                            trade_name: true,
                            logo_url: true,
                            company_type_ref: true,
                            sector_ref: true,
                            average_rating: true,
                        }
                    },
                    request: {
                        select: { id: true, product_service: true, status: true }
                    }
                }
            })
        ]);

        return {
            items: items.map((item: any) => ({
                id: item.id,
                request_id: item.request_id,
                supplier_id: item.supplier_id,
                unit_price_usd: Number(item.unit_price_usd),
                quantity: Number(item.quantity),
                total_amount_usd: Number(item.total_amount_usd),
                payment_conditions: item.payment_conditions,
                delivery_time: item.delivery_time,
                notes: item.notes,
                status: item.status,
                created_at: item.created_at,
                updated_at: item.updated_at,
                supplier: {
                    ...item.supplier,
                    company_type: item.supplier?.company_type_ref?.name ?? null,
                    sector: item.supplier?.sector_ref?.name ?? null,
                    average_rating: item.supplier?.average_rating ? Number(item.supplier.average_rating) : 0,
                },
                request: item.request,
            })),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async update(id: string, response: Partial<QuoteResponse>): Promise<QuoteResponse> {
        const dataToUpdate: any = {
            ...(response.company_offer_id !== undefined && { company_offer_id: response.company_offer_id }),
            ...(response.unit_price_usd !== undefined && { unit_price_usd: new Prisma.Decimal(response.unit_price_usd) }),
            ...(response.quantity !== undefined && { quantity: new Prisma.Decimal(response.quantity) }),
            ...(response.payment_conditions !== undefined && { payment_conditions: response.payment_conditions }),
            ...(response.payment_condition_id !== undefined && {
                payment_condition: (response as any).payment_condition_id === null
                    ? { disconnect: true }
                    : { connect: { id: (response as any).payment_condition_id } }
            }),
            ...((response as any).delivery_method_id !== undefined && {
                delivery_method: (response as any).delivery_method_id === null
                    ? { disconnect: true }
                    : { connect: { id: (response as any).delivery_method_id } }
            }),
            ...(response.delivery_time !== undefined && { delivery_time: response.delivery_time }),
            ...(response.notes !== undefined && { notes: response.notes }),
            ...(response.has_guarantee !== undefined && { has_guarantee: response.has_guarantee }),
            ...(response.status !== undefined && { status: response.status as any }),
            ...(response.rejection_reason !== undefined && { rejection_reason: response.rejection_reason }),
            ...((response as any).exchange_rate_id !== undefined && { exchange_rate_id: (response as any).exchange_rate_id }),
            ...((response as any).payment_currency !== undefined && { payment_currency: (response as any).payment_currency }),
        };

        if (response.unit_price_usd !== undefined || response.quantity !== undefined) {
             return prisma.$transaction(async (tx) => {
                 const existing = await tx.quoteResponse.findUnique({ where: { id }, select: { unit_price_usd: true, quantity: true } });
                 if (existing) {
                     const newUnitPrice = response.unit_price_usd !== undefined ? new Prisma.Decimal(response.unit_price_usd) : existing.unit_price_usd;
                     const newQuantity = response.quantity !== undefined ? new Prisma.Decimal(response.quantity) : existing.quantity;
                     dataToUpdate.total_amount_usd = new Prisma.Decimal(Number(newUnitPrice) * Number(newQuantity));
                 }
                 const updated = await tx.quoteResponse.update({
                     where: { id },
                     data: dataToUpdate
                 });
                 return this.mapToEntity(updated);
             });
        }

        const updated = await prisma.quoteResponse.update({
            where: { id },
            data: dataToUpdate
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await prisma.quoteResponse.delete({ where: { id } });
    }

    async findQuoteResponseAndSupplier(quoteResponseId: string) {
        const found = await prisma.quoteResponse.findUnique({
            where: { id: quoteResponseId },
            include: {
                supplier: {
                    select: {
                        id: true,
                        trade_name: true,
                        bio: true,
                        logo_url: true,
                        company_type_ref: true,
                        sector_ref: true,
                        average_rating: true,
                        review_count: true,
                        sector_id: true,
                        locations: true,
                    }
                },
                request: {
                    select: { id: true, product_service: true }
                }
            }
        });
        if (!found) return null;
        const entity = this.mapToEntity(found);
        return {
            ...entity,
            supplier: {
                ...found.supplier,
                sector: (found.supplier as any).sector_ref?.name ?? null,
                company_type: (found.supplier as any).company_type_ref?.name ?? null,
            },
            request: found.request
        };
    }

    private mapToEntity(db: Prisma.QuoteResponseGetPayload<{}>): QuoteResponse {
        return new QuoteResponse(
            db.id,
            db.request_id,
            db.supplier_id,
            db.company_offer_id,
            Number(db.unit_price_usd),
            Number(db.quantity),
            db.payment_conditions,
            (db as any).payment_condition_id ?? null,
            (db as any).delivery_method_id ?? null,
            db.delivery_time,
            db.notes,
            db.has_guarantee,
            db.status,
            db.rejection_reason,
            Number(db.total_amount_usd),
            (db as any).exchange_rate_id ?? null,
            (db as any).payment_currency ?? 'USD',
            db.created_at,
            db.updated_at
        );
    }
}
