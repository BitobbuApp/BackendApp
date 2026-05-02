import { CityEntity } from "../entities/city.entity";

export interface CityRepository {
    list(stateId?: number): Promise<CityEntity[]>;
    findById(id: number): Promise<CityEntity | null>;
    create(data: Partial<CityEntity>): Promise<CityEntity>;
    update(id: number, data: Partial<CityEntity>): Promise<CityEntity>;
}
