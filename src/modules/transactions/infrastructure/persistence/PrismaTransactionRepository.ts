import { TransactionRepository, PaginatedTransactions, RevisionData } from "../../domain/repositories/transaction.repository";
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
                unit_price_usd: transaction.unit_price_usd!,
                quantity: transaction.quantity!,
                total_amount_usd: transaction.total_amount_usd!,
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
                ...(transaction.exchange_rate_id !== undefined && { exchange_rate_id: transaction.exchange_rate_id }),
                ...(transaction.payment_currency !== undefined && { payment_currency: transaction.payment_currency }),
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
                include: { 
                    payment_method: true,
                    buyer: { select: { trade_name: true } },
                    supplier: { select: { trade_name: true } }
                }
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
                ...(transaction.unit_price_usd !== undefined && { unit_price_usd: transaction.unit_price_usd }),
                ...(transaction.quantity !== undefined && { quantity: transaction.quantity }),
                ...(transaction.total_amount_usd !== undefined && { total_amount_usd: transaction.total_amount_usd }),
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
                ...(transaction.exchange_rate_id !== undefined && { exchange_rate_id: transaction.exchange_rate_id }),
                ...(transaction.payment_currency !== undefined && { payment_currency: transaction.payment_currency }),
            } as any,
            include: { payment_method: true }
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await prisma.transaction.delete({ where: { id } });
    }

    async findAllAdmin(filters: any, page: number, limit: number): Promise<PaginatedTransactions> {
        const offset = (page - 1) * limit;
        const where: any = {};

        if (filters.status) {
            where.status = filters.status;
        }

        if (filters.buyer_id) {
            where.buyer_id = filters.buyer_id;
        }

        if (filters.supplier_id) {
            where.supplier_id = filters.supplier_id;
        }

        if (filters.search) {
            where.product_description = { contains: filters.search, mode: 'insensitive' };
        }

        const [items, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                skip: offset,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: { 
                    payment_method: true,
                    buyer: { select: { trade_name: true } },
                    supplier: { select: { trade_name: true } }
                }
            }),
            prisma.transaction.count({ where })
        ]);

        return {
            items: items.map((item: any) => this.mapToEntity(item)),
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        };
    }

    async updateWithRevision(
        id: string,
        transactionData: Partial<Transaction>,
        revision: RevisionData
    ): Promise<Transaction> {
        return prisma.$transaction(async (tx) => {
            const current = await tx.transaction.findUniqueOrThrow({ where: { id } });

            const dataToUpdate: any = {
                ...(transactionData.product_description !== undefined && { product_description: transactionData.product_description }),
                ...(transactionData.unit_price_usd !== undefined && { unit_price_usd: transactionData.unit_price_usd }),
                ...(transactionData.quantity !== undefined && { quantity: transactionData.quantity }),
                ...(transactionData.total_amount_usd !== undefined && { total_amount_usd: transactionData.total_amount_usd }),
                ...(transactionData.payment_method_id !== undefined && { payment_method_id: transactionData.payment_method_id }),
                ...(transactionData.payment_conditions !== undefined && { payment_conditions: transactionData.payment_conditions }),
                ...(transactionData.payment_condition_id !== undefined && {
                    payment_condition: transactionData.payment_condition_id === null
                        ? { disconnect: true }
                        : { connect: { id: transactionData.payment_condition_id } }
                }),
                ...(transactionData.delivery_time !== undefined && { delivery_time: transactionData.delivery_time }),
                ...(transactionData.status !== undefined && { status: transactionData.status as any }),
                ...(transactionData.estimated_delivery_date !== undefined && { estimated_delivery_date: transactionData.estimated_delivery_date }),
                ...(transactionData.actual_delivery_date !== undefined && { actual_delivery_date: transactionData.actual_delivery_date }),
                ...(transactionData.cancellation_reason !== undefined && { cancellation_reason: transactionData.cancellation_reason }),
                ...(transactionData.buyer_confirmed !== undefined && { buyer_confirmed: transactionData.buyer_confirmed }),
                ...(transactionData.supplier_confirmed !== undefined && { supplier_confirmed: transactionData.supplier_confirmed }),
                ...(transactionData.buyer_confirmed_at !== undefined && { buyer_confirmed_at: transactionData.buyer_confirmed_at }),
                ...(transactionData.supplier_confirmed_at !== undefined && { supplier_confirmed_at: transactionData.supplier_confirmed_at }),
                ...(transactionData.exchange_rate_id !== undefined && { exchange_rate_id: transactionData.exchange_rate_id }),
                ...(transactionData.payment_currency !== undefined && { payment_currency: transactionData.payment_currency }),
            };

            const updated = await tx.transaction.update({
                where: { id },
                data: dataToUpdate,
                include: { payment_method: true }
            });

            const snapshot = {
                unit_price_usd: Number(current.unit_price_usd),
                quantity: Number(current.quantity),
                total_amount_usd: Number(current.total_amount_usd),
                payment_method_id: current.payment_method_id,
                payment_conditions: current.payment_conditions,
                payment_condition_id: current.payment_condition_id,
                delivery_time: current.delivery_time,
                status: current.status,
                estimated_delivery_date: current.estimated_delivery_date,
                actual_delivery_date: current.actual_delivery_date,
                cancellation_reason: current.cancellation_reason,
                buyer_confirmed: current.buyer_confirmed,
                supplier_confirmed: current.supplier_confirmed,
                buyer_confirmed_at: current.buyer_confirmed_at,
                supplier_confirmed_at: current.supplier_confirmed_at,
                ...revision.snapshot,
            };

            await tx.transactionRevision.create({
                data: {
                    transaction_id: id,
                    actor_company_id: revision.actorCompanyId,
                    action: revision.action as any,
                    snapshot,
                },
            });

            return this.mapToEntity(updated);
        }, {
            maxWait: 300000,
            timeout: 300000
        });
    }

    private mapToEntity(db: any): Transaction {
        return new Transaction(
            db.id,
            db.quote_response_id,
            db.buyer_id,
            db.supplier_id,
            db.product_description,
            Number(db.unit_price_usd),
            Number(db.quantity),
            Number(db.total_amount_usd),
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
            db.exchange_rate_id ?? null,
            db.payment_currency ?? 'USD',
            db.buyer_review_status ?? 'pending',
            db.supplier_review_status ?? 'pending',
            db.buyer?.trade_name ?? null,
            db.supplier?.trade_name ?? null,
            db.serial_number ?? null,
            db.created_at,
            db.updated_at
        );
    }
}
