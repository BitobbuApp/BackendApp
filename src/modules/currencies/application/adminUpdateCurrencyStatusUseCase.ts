import { UseCase } from "../../../shared/application/useCase";
import { CurrencyRepository } from "../domain/repositories/currency.repository";
import { PrismaCurrencyRepository } from "../infrastructure/persistence/PrismaCurrencyRepository";
import { adminUpdateCurrencyStatusInputSchema, currencyDtoResponseSchema } from "./dtos/currency.dto";

interface AdminUpdateCurrencyStatusInput {
    code: string;
    is_active: boolean;
}

export class AdminUpdateCurrencyStatusUseCase extends UseCase<AdminUpdateCurrencyStatusInput, any> {
    protected inputSchema = adminUpdateCurrencyStatusInputSchema;
    protected outputSchema = currencyDtoResponseSchema;
    private readonly currencyRepository: CurrencyRepository;

    constructor() {
        super();
        this.currencyRepository = new PrismaCurrencyRepository();
    }

    protected async implementation(input: AdminUpdateCurrencyStatusInput): Promise<any> {
        return this.currencyRepository.updateStatus(input.code, input.is_active);
    }
}
