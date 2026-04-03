import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { StateRepository } from "../domain/repositories/state.repository";
import { PrismaStateRepository } from "../infrastructure/persistence/PrismaStateRepository";
import { listStatesByCountryDtoRequestSchema, listStatesByCountryDtoResponseSchema } from "./dtos/state.dto";

interface ListStatesByCountryInput {
    country_id: number;
}

export class ListStatesByCountryUseCase extends UseCase<ListStatesByCountryInput, any> {
    protected inputSchema: Joi.Schema = listStatesByCountryDtoRequestSchema;
    protected outputSchema: Joi.Schema = listStatesByCountryDtoResponseSchema;
    private readonly stateRepository: StateRepository;

    constructor() {
        super();
        this.stateRepository = new PrismaStateRepository();
    }

    protected async implementation(data: ListStatesByCountryInput): Promise<any> {
        return await this.stateRepository.listByCountryId(data.country_id);
    }
}
