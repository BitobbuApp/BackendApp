import { Country } from "../entities/country.entity";

export interface CountryRepository {
    list(): Promise<Country[]>;
}
