import { UseCase } from "../../../shared/application/useCase";
import { LocationRepository } from "../domain/repositories/location.repository";
import { PrismaLocationRepository } from "../infrastructure/persistence/PrismaLocationRepository";
import { locationDtoResponseSchema } from "./dtos/location.dto";
import Joi from "joi";
import { CompanyLocation } from "../domain/entities/location.entity";
import { LocationNotFoundError } from "../domain/errors/company.errors";

interface UpdateLocationInput {
    id: string;
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    tax_address?: string;
    national_coverage?: boolean;
    is_main_headquarters?: boolean;
}

export class UpdateLocationUseCase extends UseCase<UpdateLocationInput, CompanyLocation> {
    protected inputSchema: Joi.Schema = Joi.object({
        id: Joi.string().uuid().required(),
        country_id: Joi.number().integer().min(1).allow(null),
        state_id: Joi.number().integer().min(1).allow(null),
        city_id: Joi.number().integer().min(1).allow(null),
        tax_address: Joi.string().allow(null, ''),
        national_coverage: Joi.boolean(),
        is_main_headquarters: Joi.boolean()
    });
    protected outputSchema: Joi.Schema = locationDtoResponseSchema;
    private readonly locationRepository: LocationRepository;

    constructor() {
        super();
        this.locationRepository = new PrismaLocationRepository();
    }

    protected async implementation(data: UpdateLocationInput): Promise<CompanyLocation> {
        const { id, ...updateData } = data;

        const existing = await this.locationRepository.findById(id);
        if (!existing) throw new LocationNotFoundError(id);

        if (updateData.is_main_headquarters && !existing.is_main_headquarters) {
            await this.locationRepository.resetMainHeadquarters(existing.company_id);
        }

        return this.locationRepository.update(id, updateData);
    }
}
