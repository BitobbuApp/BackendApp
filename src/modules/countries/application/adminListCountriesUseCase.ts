import { UseCase } from "../../../shared/application/useCase";
import { CountryRepository } from "../domain/repositories/country.repository";
import { PrismaCountryRepository } from "../infrastructure/persistence/PrismaCountryRepository";
import { listCountriesDtoResponseSchema } from "./dtos/country.dto";

import Joi from "joi";

export class AdminListCountriesUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.any().optional();
    protected outputSchema = listCountriesDtoResponseSchema;
    private readonly countryRepository: CountryRepository;

    constructor(countryRepository?: CountryRepository) {
        super();
        this.countryRepository = countryRepository || new PrismaCountryRepository();
    }

    protected async implementation(): Promise<any> {
        const countries = await this.countryRepository.findAll();
        return countries;
    }
}
