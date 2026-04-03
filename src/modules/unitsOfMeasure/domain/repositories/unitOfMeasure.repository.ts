import { UnitOfMeasure } from "../entities/unitOfMeasure.entity";

export interface UnitOfMeasureRepository {
    list(): Promise<UnitOfMeasure[]>;
}
