import { State } from "../entities/state.entity";

export interface StateRepository {
    listByCountryId(country_id: number): Promise<State[]>;
    findAll(filters?: { country_id?: number }): Promise<State[]>;
    findById(id: number): Promise<State | null>;
    create(data: Partial<State>): Promise<State>;
    update(id: number, data: Partial<State>): Promise<State>;
}
