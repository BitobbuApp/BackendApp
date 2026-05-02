import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { CurrencyRepository } from "../domain/repositories/currency.repository";
import { PrismaCurrencyRepository } from "../infrastructure/persistence/PrismaCurrencyRepository";
import { listCurrenciesDtoResponseSchema } from "./dtos/currency.dto";

export class AdminListCurrenciesUseCase extends UseCase<Record<string, never>, any> {
    protected inputSchema = Joi.object({});
    protected outputSchema = listCurrenciesDtoResponseSchema;
    private readonly currencyRepository: CurrencyRepository;

    constructor() {
        super();
        this.currencyRepository = new PrismaCurrencyRepository();
    }

    protected async implementation(): Promise<any> {
        return this.currencyRepository.list();
    }
}
