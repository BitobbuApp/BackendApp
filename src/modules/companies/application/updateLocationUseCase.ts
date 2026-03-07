import { UseCase } from "../../../shared/application/useCase";
import { LocationRepository } from "../domain/repositories/location.repository";
import { locationDtoResponseSchema } from "./dtos/location.dto";
import Joi from "joi";
import { CompanyLocation, VenezuelaState } from "../domain/entities/location.entity";
import { LocationNotFoundError } from "../domain/errors/company.errors";

interface UpdateLocationInput {
    id: string;
    state?: VenezuelaState;
    city?: string;
    tax_address?: string;
    national_coverage?: boolean;
    is_main_headquarters?: boolean;
}

export class UpdateLocationUseCase extends UseCase<UpdateLocationInput, CompanyLocation> {
    protected inputSchema: Joi.Schema = Joi.object({
        id: Joi.string().uuid().required(),
        state: Joi.string().valid(
            'Amazonas', 'Anzoategui', 'Apure', 'Aragua', 'Barinas', 'Bolivar', 'Carabobo', 'Cojedes',
            'Delta_Amacuro', 'Distrito_Capital', 'Falcon', 'Guarico', 'Lara', 'Merida', 'Miranda', 'Monagas',
            'Nueva_Esparta', 'Portuguesa', 'Sucre', 'Tachira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
        ),
        city: Joi.string().max(100),
        tax_address: Joi.string().allow(null, ''),
        national_coverage: Joi.boolean(),
        is_main_headquarters: Joi.boolean()
    });
    protected outputSchema: Joi.Schema = locationDtoResponseSchema;

    constructor(private readonly locationRepository: LocationRepository) {
        super();
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
