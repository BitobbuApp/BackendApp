import { UseCase } from "../../../shared/application/useCase";
import { ExchangeRateRepository } from "../domain/repositories/exchangeRate.repository";
import { PrismaExchangeRateRepository } from "../infrastructure/persistence/PrismaExchangeRateRepository";
import { adminListExchangeRatesInputSchema, listExchangeRatesDtoResponseSchema } from "./dtos/exchangeRate.dto";

interface AdminListExchangeRatesInput {
    from_currency?: string;
    to_currency?: string;
    effective_date?: string;
}

export class AdminListExchangeRatesUseCase extends UseCase<AdminListExchangeRatesInput, any> {
    protected inputSchema = adminListExchangeRatesInputSchema;
    protected outputSchema = listExchangeRatesDtoResponseSchema;
    private readonly exchangeRateRepository: ExchangeRateRepository;

    constructor() {
        super();
        this.exchangeRateRepository = new PrismaExchangeRateRepository();
    }

    protected async implementation(input: AdminListExchangeRatesInput): Promise<any> {
        return this.exchangeRateRepository.list(input);
    }
}
