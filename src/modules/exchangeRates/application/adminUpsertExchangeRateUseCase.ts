import { ApplicationError } from "../../../shared/domain/error";
import { UseCase } from "../../../shared/application/useCase";
import { ExchangeRateRepository } from "../domain/repositories/exchangeRate.repository";
import { PrismaExchangeRateRepository } from "../infrastructure/persistence/PrismaExchangeRateRepository";
import { adminUpsertExchangeRateInputSchema, exchangeRateDtoResponseSchema } from "./dtos/exchangeRate.dto";

interface AdminUpsertExchangeRateInput {
    id?: string;
    data: {
        from_currency: string;
        to_currency: string;
        rate: number;
        source: string;
        effective_date: Date;
    };
}

export class AdminUpsertExchangeRateUseCase extends UseCase<AdminUpsertExchangeRateInput, any> {
    protected inputSchema = adminUpsertExchangeRateInputSchema;
    protected outputSchema = exchangeRateDtoResponseSchema;
    private readonly exchangeRateRepository: ExchangeRateRepository;

    constructor() {
        super();
        this.exchangeRateRepository = new PrismaExchangeRateRepository();
    }

    protected async implementation(input: AdminUpsertExchangeRateInput): Promise<any> {
        if (input.id) {
            const existing = await this.exchangeRateRepository.findById(input.id);
            if (!existing) {
                throw new ApplicationError(404, "Exchange rate not found");
            }
            return this.exchangeRateRepository.update(input.id, input.data);
        }

        return this.exchangeRateRepository.create(input.data);
    }
}
