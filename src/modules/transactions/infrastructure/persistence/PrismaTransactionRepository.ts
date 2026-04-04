import { TransactionRepository, PaginatedTransactions } from "../../domain/repositories/transaction.repository";
import { Transaction } from "../../domain/entities/transaction.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaTransactionRepository implements TransactionRepository {
    async create(transaction: Partial<Transaction>): Promise<Transaction> {
        const created = await prisma.transaction.create({
            data: {
                quote_response_id: transaction.quote_response_id!,
                buyer_id: transaction.buyer_id!,
                supplier_id: transaction.supplier_id!,
                product_description: transaction.product_description!,
                unit_price: transaction.unit_price!,
                quantity: transaction.quantity!,
                total_amount: transaction.total_amount!,
                ...(transaction.payment_method_id !== undefined && { payment_method_id: transaction.payment_method_id }),
                payment_conditions: transaction.payment_conditions ?? null,
                payment_condition_id: transaction.payment_condition_id ?? null,
                delivery_time: transaction.delivery_time ?? null,
                status: (transaction.status as any) ?? 'in_process',
                estimated_delivery_date: transaction.estimated_delivery_date ?? null,
                actual_delivery_date: transaction.actual_delivery_date ?? null,
                cancellation_reason: transaction.cancellation_reason ?? null,
                buyer_confirmed: transaction.buyer_confirmed ?? false,
                supplier_confirmed: transaction.supplier_confirmed ?? false,
                buyer_confirmed_at: transaction.buyer_confirmed_at ?? null,
                supplier_confirmed_at: transaction.supplier_confirmed_at ?? null,
            } as any
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<Transaction | null> {
        const found = await prisma.transaction.findUnique({ where: { id }, include: { payment_method: true } });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByCompanyId(companyId: string, page: number, limit: number): Promise<PaginatedTransactions> {
        const offset = (page - 1) * limit;

        const [items, total] = await Promise.all([
            prisma.transaction.findMany({
                where: {
                    OR: [
                        { buyer_id: companyId },
                        { supplier_id: companyId }
                    ]
                },
                skip: offset,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: { payment_method: true }
            }),
            prisma.transaction.count({
                where: {
                    OR: [
                        { buyer_id: companyId },
                        { supplier_id: companyId }
                    ]
                }
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

    async update(id: string, transaction: Partial<Transaction>): Promise<Transaction> {
        const updated = await prisma.transaction.update({
            where: { id },
            data: {
                ...(transaction.product_description !== undefined && { product_description: transaction.product_description }),
                ...(transaction.unit_price !== undefined && { unit_price: transaction.unit_price }),
                ...(transaction.quantity !== undefined && { quantity: transaction.quantity }),
                ...(transaction.total_amount !== undefined && { total_amount: transaction.total_amount }),
                ...(transaction.payment_method_id !== undefined && { payment_method_id: transaction.payment_method_id }),
                ...(transaction.payment_conditions !== undefined && { payment_conditions: transaction.payment_conditions }),
                ...(transaction.payment_condition_id !== undefined && {
                    payment_condition: transaction.payment_condition_id === null
                        ? { disconnect: true }
                        : { connect: { id: transaction.payment_condition_id } }
                }),
                ...(transaction.delivery_time !== undefined && { delivery_time: transaction.delivery_time }),
                ...(transaction.status !== undefined && { status: transaction.status as any }),
                ...(transaction.estimated_delivery_date !== undefined && { estimated_delivery_date: transaction.estimated_delivery_date }),
                ...(transaction.actual_delivery_date !== undefined && { actual_delivery_date: transaction.actual_delivery_date }),
                ...(transaction.cancellation_reason !== undefined && { cancellation_reason: transaction.cancellation_reason }),
                ...(transaction.buyer_confirmed !== undefined && { buyer_confirmed: transaction.buyer_confirmed }),
                ...(transaction.supplier_confirmed !== undefined && { supplier_confirmed: transaction.supplier_confirmed }),
                ...(transaction.buyer_confirmed_at !== undefined && { buyer_confirmed_at: transaction.buyer_confirmed_at }),
                ...(transaction.supplier_confirmed_at !== undefined && { supplier_confirmed_at: transaction.supplier_confirmed_at }),
            } as any,
            include: { payment_method: true }
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await prisma.transaction.delete({ where: { id } });
    }

    private mapToEntity(db: any): Transaction {
        return new Transaction(
            db.id,
            db.quote_response_id,
            db.buyer_id,
            db.supplier_id,
            db.product_description,
            Number(db.unit_price),
            Number(db.quantity),
            Number(db.total_amount),
            db.payment_method_id,
            db.payment_method?.name_es ?? null,
            db.payment_conditions,
            db.payment_condition_id ?? null,
            db.delivery_time,
            db.status,
            db.estimated_delivery_date,
            db.actual_delivery_date,
            db.cancellation_reason,
            db.buyer_confirmed,
            db.supplier_confirmed,
            db.buyer_confirmed_at,
            db.supplier_confirmed_at,
            db.created_at,
            db.updated_at
        );
    }
}
