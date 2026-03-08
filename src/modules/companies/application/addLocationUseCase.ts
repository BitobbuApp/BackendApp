import { UseCase } from "../../../shared/application/useCase";
import { LocationRepository } from "../domain/repositories/location.repository";
import { PrismaLocationRepository } from "../infrastructure/persistence/PrismaLocationRepository";
import { addLocationDtoRequestSchema, locationDtoResponseSchema } from "./dtos/location.dto";
import Joi from "joi";
import { CompanyLocation, VenezuelaState } from "../domain/entities/location.entity";

interface AddLocationInput {
    company_id: string;
    state: VenezuelaState;
    city: string;
    tax_address?: string;
    national_coverage?: boolean;
    is_main_headquarters?: boolean;
}

export class AddLocationUseCase extends UseCase<AddLocationInput, CompanyLocation> {
    protected inputSchema: Joi.Schema = addLocationDtoRequestSchema;
    protected outputSchema: Joi.Schema = locationDtoResponseSchema;
    private readonly locationRepository: LocationRepository;

    constructor() {
        super();
        this.locationRepository = new PrismaLocationRepository();
    }

    protected async implementation(data: AddLocationInput): Promise<CompanyLocation> {
        // Si se marca como sede principal, debemos resetear las demás de esta empresa
        if (data.is_main_headquarters) {
            await this.locationRepository.resetMainHeadquarters(data.company_id);
        } else {
            // Si es la primera locación, forzarla como principal
            const existing = await this.locationRepository.findByCompanyId(data.company_id);
            if (existing.length === 0) {
                data.is_main_headquarters = true;
            }
        }

        return this.locationRepository.create(data);
    }
}
