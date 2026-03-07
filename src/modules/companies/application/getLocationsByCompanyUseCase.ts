import { UseCase } from "../../../shared/application/useCase";
import { LocationRepository } from "../domain/repositories/location.repository";
import { locationDtoResponseSchema } from "./dtos/location.dto";
import Joi from "joi";
import { CompanyLocation } from "../domain/entities/location.entity";

export class GetLocationsByCompanyUseCase extends UseCase<string, CompanyLocation[]> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = Joi.array().items(locationDtoResponseSchema);

    constructor(private readonly locationRepository: LocationRepository) {
        super();
    }

    protected async implementation(companyId: string): Promise<CompanyLocation[]> {
        return this.locationRepository.findByCompanyId(companyId);
    }
}
