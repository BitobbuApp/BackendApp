import { TransactionRepository, PaginatedTransactions, RevisionData } from "../../domain/repositories/transaction.repository";
import { Transaction } from "../../domain/entities/transaction.entity";
import { prisma } from '../../../../shared/infrastructure/database';
import { pickDefined, connectOrDisconnect, connectIfPresent } from "../../../../shared/infrastructure/database/prismaDataHelpers";

export class PrismaTransactionRepository implements TransactionRepository {
    async create(transaction: Partial<Transaction>): Promise<Transaction> {
        const rawData = {
            quote_response_id: transaction.quote_response_id!,
            buyer_id: transaction.buyer_id!,
            supplier_id: transaction.supplier_id!,
            product_description: transaction.product_description!,
            unit_price_usd: transaction.unit_price_usd!,
            quantity: transaction.quantity!,
            total_amount_usd: transaction.total_amount_usd!,
            payment_method_id: transaction.payment_method_id,
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
            exchange_rate_id: transaction.exchange_rate_id,
            payment_currency: transaction.payment_currency,
        };

        const created = await prisma.transaction.create({
            data: pickDefined(rawData) as any
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
        const rawData = {
            product_description: transaction.product_description,
            unit_price_usd: transaction.unit_price_usd,
            quantity: transaction.quantity,
            total_amount_usd: transaction.total_amount_usd,
            payment_method_id: transaction.payment_method_id,
            payment_conditions: transaction.payment_conditions,
            delivery_time: transaction.delivery_time,
            status: transaction.status as any,
            estimated_delivery_date: transaction.estimated_delivery_date,
            actual_delivery_date: transaction.actual_delivery_date,
            cancellation_reason: transaction.cancellation_reason,
            buyer_confirmed: transaction.buyer_confirmed,
            supplier_confirmed: transaction.supplier_confirmed,
            buyer_confirmed_at: transaction.buyer_confirmed_at,
            supplier_confirmed_at: transaction.supplier_confirmed_at,
            exchange_rate_id: transaction.exchange_rate_id,
            payment_currency: transaction.payment_currency,
        };

        const data = pickDefined(rawData) as any;
        if (transaction.payment_condition_id !== undefined) {
            data.payment_condition = connectOrDisconnect(transaction.payment_condition_id);
        }

        const updated = await prisma.transaction.update({
            where: { id },
            data,
            include: { payment_method: true }
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await prisma.transaction.delete({ where: { id } });
    }

    async updateWithRevision(
        id: string,
        transactionData: Partial<Transaction>,
        revision: RevisionData
    ): Promise<Transaction> {
        return prisma.$transaction(async (tx) => {
            const current = await tx.transaction.findUniqueOrThrow({ where: { id } });

            const rawData = {
                product_description: transactionData.product_description,
                unit_price_usd: transactionData.unit_price_usd,
                quantity: transactionData.quantity,
                total_amount_usd: transactionData.total_amount_usd,
                payment_method_id: transactionData.payment_method_id,
                payment_conditions: transactionData.payment_conditions,
                delivery_time: transactionData.delivery_time,
                status: transactionData.status as any,
                estimated_delivery_date: transactionData.estimated_delivery_date,
                actual_delivery_date: transactionData.actual_delivery_date,
                cancellation_reason: transactionData.cancellation_reason,
                buyer_confirmed: transactionData.buyer_confirmed,
                supplier_confirmed: transactionData.supplier_confirmed,
                buyer_confirmed_at: transactionData.buyer_confirmed_at,
                supplier_confirmed_at: transactionData.supplier_confirmed_at,
                exchange_rate_id: transactionData.exchange_rate_id,
                payment_currency: transactionData.payment_currency,
            };

            const dataToUpdate = pickDefined(rawData) as any;
            if (transactionData.payment_condition_id !== undefined) {
                dataToUpdate.payment_condition = connectOrDisconnect(transactionData.payment_condition_id);
            }

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
            db.created_at,
            db.updated_at
        );
    }
}
