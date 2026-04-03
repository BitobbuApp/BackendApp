import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { CountryRepository } from "../domain/repositories/country.repository";
import { PrismaCountryRepository } from "../infrastructure/persistence/PrismaCountryRepository";
import { listCountriesDtoResponseSchema } from "./dtos/country.dto";

export class ListCountriesUseCase extends UseCase<Record<string, never>, any> {
    protected inputSchema: Joi.Schema = Joi.object({});
    protected outputSchema: Joi.Schema = listCountriesDtoResponseSchema;
    private readonly countryRepository: CountryRepository;

    constructor() {
        super();
        this.countryRepository = new PrismaCountryRepository();
    }

    protected async implementation(): Promise<any> {
        return await this.countryRepository.list();
    }
}
