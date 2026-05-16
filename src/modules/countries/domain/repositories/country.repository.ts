import { Country } from "../entities/country.entity";

export interface CountryRepository {
    list(): Promise<Country[]>; // Active only
    findAll(): Promise<Country[]>; // All
    findById(id: number): Promise<Country | null>;
    create(data: Partial<Country>): Promise<Country>;
    update(id: number, data: Partial<Country>): Promise<Country>;
}
