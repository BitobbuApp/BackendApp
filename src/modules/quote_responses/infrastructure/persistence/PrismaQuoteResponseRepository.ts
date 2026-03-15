import { QuoteResponseRepository, PaginatedResult } from "../../domain/repositories/quote_response.repository";
import { QuoteResponse, ResponseStatus } from "../../domain/entities/quote_response.entity";
import { prisma } from '../../../../shared/infrastructure/database';
import { Prisma } from "@prisma/client";

export class PrismaQuoteResponseRepository implements QuoteResponseRepository {
    async create(response: Partial<QuoteResponse>): Promise<QuoteResponse> {
        try {
            const created = await prisma.quoteResponse.create({
                data: {
                    request_id: response.request_id!,
                    supplier_id: response.supplier_id!,
                    company_offer_id: response.company_offer_id ?? null,
                    unit_price: new Prisma.Decimal(response.unit_price!),
                    quantity: new Prisma.Decimal(response.quantity!),
                    payment_conditions: response.payment_conditions ?? null,
                    delivery_time: response.delivery_time ?? null,
                    notes: response.notes ?? null,
                    status: (response.status as any) ?? 'Pending',
                    rejection_reason: response.rejection_reason ?? null,
                    total_amount: new Prisma.Decimal(response.unit_price! * response.quantity!), // total_amount could be computed here if Prisma requires a value, though comment in schema says Computed in DB... it also says Prisma supports reading. I will provide a value to be safe.
                }
            });
            return this.mapToEntity(created);
        } catch (error: any) {
            // Check for Prisma unique constraint violation code
            if (error.code === 'P2002') {
                throw new Error('DuplicateQuoteResponseError'); // Will map in usecase or create directly if needed
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
            items: items.map((item: any) => this.mapToEntity(item)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async update(id: string, response: Partial<QuoteResponse>): Promise<QuoteResponse> {
        const dataToUpdate: any = {
            ...(response.company_offer_id !== undefined && { company_offer_id: response.company_offer_id }),
            ...(response.unit_price !== undefined && { unit_price: new Prisma.Decimal(response.unit_price) }),
            ...(response.quantity !== undefined && { quantity: new Prisma.Decimal(response.quantity) }),
            ...(response.payment_conditions !== undefined && { payment_conditions: response.payment_conditions }),
            ...(response.delivery_time !== undefined && { delivery_time: response.delivery_time }),
            ...(response.notes !== undefined && { notes: response.notes }),
            ...(response.status !== undefined && { status: response.status as any }),
            ...(response.rejection_reason !== undefined && { rejection_reason: response.rejection_reason }),
        };

        if (response.unit_price !== undefined || response.quantity !== undefined) {
             const existing = await prisma.quoteResponse.findUnique({ where: { id }, select: { unit_price: true, quantity: true } });
             if (existing) {
                 const newUnitPrice = response.unit_price !== undefined ? new Prisma.Decimal(response.unit_price) : existing.unit_price;
                 const newQuantity = response.quantity !== undefined ? new Prisma.Decimal(response.quantity) : existing.quantity;
                 dataToUpdate.total_amount = new Prisma.Decimal(Number(newUnitPrice) * Number(newQuantity));
             }
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

    private mapToEntity(db: any): QuoteResponse {
        return new QuoteResponse(
            db.id,
            db.request_id,
            db.supplier_id,
            db.company_offer_id,
            Number(db.unit_price),
            Number(db.quantity),
            db.payment_conditions,
            db.delivery_time,
            db.notes,
            db.status,
            db.rejection_reason,
            Number(db.total_amount),
            db.created_at,
            db.updated_at
        );
    }
}
