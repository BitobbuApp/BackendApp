import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { listUnitsOfMeasureDtoResponseSchema } from "./dtos/unitOfMeasure.dto";
import { UnitOfMeasureRepository } from "../domain/repositories/unitOfMeasure.repository";
import { PrismaUnitOfMeasureRepository } from "../infrastructure/persistence/PrismaUnitOfMeasureRepository";

export class ListUnitsOfMeasureUseCase extends UseCase<Record<string, never>, any> {
    protected inputSchema: Joi.Schema = Joi.object({});
    protected outputSchema: Joi.Schema = listUnitsOfMeasureDtoResponseSchema;
    private readonly unitOfMeasureRepository: UnitOfMeasureRepository;

    constructor() {
        super();
        this.unitOfMeasureRepository = new PrismaUnitOfMeasureRepository();
    }

    protected async implementation(): Promise<any> {
        return await this.unitOfMeasureRepository.list();
    }
}
