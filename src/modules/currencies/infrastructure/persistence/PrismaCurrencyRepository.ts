import { prisma } from "../../../../shared/infrastructure/database";
import { ApplicationError } from "../../../../shared/domain/error";
import { CurrencyEntity } from "../../domain/entities/currency.entity";
import { CurrencyRepository } from "../../domain/repositories/currency.repository";

export class PrismaCurrencyRepository implements CurrencyRepository {
    async list(): Promise<CurrencyEntity[]> {
        const items = await prisma.currency.findMany({
            orderBy: { code: 'asc' },
        });
        return items.map((item) => this.mapToEntity(item));
    }

    async findByCode(code: string): Promise<CurrencyEntity | null> {
        const item = await prisma.currency.findUnique({ where: { code } });
        return item ? this.mapToEntity(item) : null;
    }

    async create(data: Partial<CurrencyEntity>): Promise<CurrencyEntity> {
        try {
            const created = await prisma.currency.create({
                data: {
                    code: data.code!,
                    name_en: data.name_en!,
                    name_es: data.name_es!,
                    symbol: data.symbol!,
                    decimal_places: data.decimal_places ?? 2,
                    is_active: data.is_active ?? true,
                },
            });
            return this.mapToEntity(created);
        } catch (error: any) {
            if (error?.code === 'P2002') {
                throw new ApplicationError(409, "Currency already exists");
            }
            throw error;
        }
    }

    async update(code: string, data: Partial<CurrencyEntity>): Promise<CurrencyEntity> {
        const updated = await prisma.currency.update({
            where: { code },
            data: {
                ...(data.code !== undefined && { code: data.code }),
                ...(data.name_en !== undefined && { name_en: data.name_en }),
                ...(data.name_es !== undefined && { name_es: data.name_es }),
                ...(data.symbol !== undefined && { symbol: data.symbol }),
                ...(data.decimal_places !== undefined && { decimal_places: data.decimal_places }),
                ...(data.is_active !== undefined && { is_active: data.is_active }),
            },
        });
        return this.mapToEntity(updated);
    }

    async updateStatus(code: string, isActive: boolean): Promise<CurrencyEntity> {
        const updated = await prisma.currency.update({
            where: { code },
            data: { is_active: isActive },
        });
        return this.mapToEntity(updated);
    }

    private mapToEntity(db: any): CurrencyEntity {
        return new CurrencyEntity(
            db.code,
            db.name_en,
            db.name_es,
            db.symbol,
            db.decimal_places,
            db.is_active,
        );
    }
}
