import { State } from "../entities/state.entity";

export interface StateRepository {
    listByCountryId(country_id: number): Promise<State[]>;
}
