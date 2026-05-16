import { ApplicationError } from "../../../shared/domain/error";
import { UseCase } from "../../../shared/application/useCase";
import { CurrencyRepository } from "../domain/repositories/currency.repository";
import { PrismaCurrencyRepository } from "../infrastructure/persistence/PrismaCurrencyRepository";
import { adminUpsertCurrencyInputSchema, currencyDtoResponseSchema } from "./dtos/currency.dto";

interface AdminUpsertCurrencyInput {
    code?: string;
    data: {
        code: string;
        name_en: string;
        name_es: string;
        symbol: string;
        decimal_places: number;
        is_active?: boolean;
    };
}

export class AdminUpsertCurrencyUseCase extends UseCase<AdminUpsertCurrencyInput, any> {
    protected inputSchema = adminUpsertCurrencyInputSchema;
    protected outputSchema = currencyDtoResponseSchema;
    private readonly currencyRepository: CurrencyRepository;

    constructor() {
        super();
        this.currencyRepository = new PrismaCurrencyRepository();
    }

    protected async implementation(input: AdminUpsertCurrencyInput): Promise<any> {
        if (input.code) {
            const existing = await this.currencyRepository.findByCode(input.code);
            if (!existing) {
                throw new ApplicationError(404, "Currency not found");
            }
            return this.currencyRepository.update(input.code, input.data);
        }

        return this.currencyRepository.create(input.data);
    }
}
