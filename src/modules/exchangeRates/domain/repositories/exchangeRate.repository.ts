import { ExchangeRateEntity } from "../entities/exchangeRate.entity";

export interface ExchangeRateRepository {
    list(filters?: { from_currency?: string; to_currency?: string; effective_date?: string }): Promise<ExchangeRateEntity[]>;
    findById(id: string): Promise<ExchangeRateEntity | null>;
    create(data: Partial<ExchangeRateEntity>): Promise<ExchangeRateEntity>;
    update(id: string, data: Partial<ExchangeRateEntity>): Promise<ExchangeRateEntity>;
}
