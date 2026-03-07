import { UseCase } from "../../../shared/application/useCase";
import { LocationRepository } from "../domain/repositories/location.repository";
import Joi from "joi";
import { LocationNotFoundError } from "../domain/errors/company.errors";

export class RemoveLocationUseCase extends UseCase<string, { success: boolean }> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = Joi.object({
        success: Joi.boolean().required()
    });

    constructor(private readonly locationRepository: LocationRepository) {
        super();
    }

    protected async implementation(id: string): Promise<{ success: boolean }> {
        const existing = await this.locationRepository.findById(id);
        if (!existing) throw new LocationNotFoundError(id);

        if (existing.is_main_headquarters) {
            // No permitimos borrar la sede principal sin asignar otra primero
            const all = await this.locationRepository.findByCompanyId(existing.company_id);
            if (all.length > 1) {
                throw new Error("Cannot delete the main headquarters. Please assign another location as main first.");
            }
        }

        await this.locationRepository.delete(id);
        return { success: true };
    }
}
