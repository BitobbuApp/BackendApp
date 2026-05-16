import { prisma } from "../../../../shared/infrastructure/database";
import { ApplicationError } from "../../../../shared/domain/error";
import { ExchangeRateEntity } from "../../domain/entities/exchangeRate.entity";
import { ExchangeRateRepository } from "../../domain/repositories/exchangeRate.repository";

export class PrismaExchangeRateRepository implements ExchangeRateRepository {
    async list(filters?: { from_currency?: string; to_currency?: string; effective_date?: string }): Promise<ExchangeRateEntity[]> {
        const items = await prisma.exchangeRate.findMany({
            where: {
                ...(filters?.from_currency && { from_currency: filters.from_currency }),
                ...(filters?.to_currency && { to_currency: filters.to_currency }),
                ...(filters?.effective_date && { effective_date: new Date(filters.effective_date) }),
            },
            orderBy: [
                { effective_date: 'desc' },
                { from_currency: 'asc' },
                { to_currency: 'asc' },
            ],
        });

        return items.map((item) => this.mapToEntity(item));
    }

    async findById(id: string): Promise<ExchangeRateEntity | null> {
        const item = await prisma.exchangeRate.findUnique({ where: { id } });
        return item ? this.mapToEntity(item) : null;
    }

    async create(data: Partial<ExchangeRateEntity>): Promise<ExchangeRateEntity> {
        try {
            const created = await prisma.exchangeRate.create({
                data: {
                    from_currency: data.from_currency!,
                    to_currency: data.to_currency!,
                    rate: data.rate!,
                    source: data.source!,
                    effective_date: data.effective_date!,
                },
            });
            return this.mapToEntity(created);
        } catch (error: any) {
            if (error?.code === 'P2002') {
                throw new ApplicationError(409, "Exchange rate already exists for the same source and effective date");
            }
            throw error;
        }
    }

    async update(id: string, data: Partial<ExchangeRateEntity>): Promise<ExchangeRateEntity> {
        const updated = await prisma.exchangeRate.update({
            where: { id },
            data: {
                ...(data.from_currency !== undefined && { from_currency: data.from_currency }),
                ...(data.to_currency !== undefined && { to_currency: data.to_currency }),
                ...(data.rate !== undefined && { rate: data.rate }),
                ...(data.source !== undefined && { source: data.source }),
                ...(data.effective_date !== undefined && { effective_date: data.effective_date }),
            },
        });
        return this.mapToEntity(updated);
    }

    private mapToEntity(db: any): ExchangeRateEntity {
        return new ExchangeRateEntity(
            db.id,
            db.from_currency,
            db.to_currency,
            Number(db.rate),
            db.source,
            db.effective_date,
        );
    }
}
