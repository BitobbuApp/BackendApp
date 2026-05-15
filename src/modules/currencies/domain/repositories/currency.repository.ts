import { CurrencyEntity } from "../entities/currency.entity";

export interface CurrencyRepository {
    list(): Promise<CurrencyEntity[]>;
    findByCode(code: string): Promise<CurrencyEntity | null>;
    create(data: Partial<CurrencyEntity>): Promise<CurrencyEntity>;
    update(code: string, data: Partial<CurrencyEntity>): Promise<CurrencyEntity>;
    updateStatus(code: string, isActive: boolean): Promise<CurrencyEntity>;
}
