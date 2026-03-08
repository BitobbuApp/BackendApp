import { UseCase } from "../../../shared/application/useCase";
import { LocationRepository } from "../domain/repositories/location.repository";
import { locationDtoResponseSchema } from "./dtos/location.dto";
import Joi from "joi";
import { CompanyLocation } from "../domain/entities/location.entity";

import { PrismaLocationRepository } from "../infrastructure/persistence/PrismaLocationRepository";

export class GetLocationsByCompanyUseCase extends UseCase<string, any[]> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = Joi.array().items(locationDtoResponseSchema);
    private readonly locationRepository: LocationRepository;

    constructor() {
        super();
        this.locationRepository = new PrismaLocationRepository();
    }

    protected async implementation(companyId: string): Promise<CompanyLocation[]> {
        return this.locationRepository.findByCompanyId(companyId);
    }
}
