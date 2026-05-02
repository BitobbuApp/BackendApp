import { ApplicationError } from "../../../shared/domain/error";
import { UseCase } from "../../../shared/application/useCase";
import { CityRepository } from "../domain/repositories/city.repository";
import { PrismaCityRepository } from "../infrastructure/persistence/PrismaCityRepository";
import { adminUpsertCityInputSchema, cityDtoResponseSchema } from "./dtos/city.dto";

interface AdminUpsertCityInput {
    id?: number;
    data: {
        state_id: number;
        name: string;
    };
}

export class AdminUpsertCityUseCase extends UseCase<AdminUpsertCityInput, any> {
    protected inputSchema = adminUpsertCityInputSchema;
    protected outputSchema = cityDtoResponseSchema;
    private readonly cityRepository: CityRepository;

    constructor() {
        super();
        this.cityRepository = new PrismaCityRepository();
    }

    protected async implementation(input: AdminUpsertCityInput): Promise<any> {
        if (input.id) {
            const existing = await this.cityRepository.findById(input.id);
            if (!existing) {
                throw new ApplicationError(404, "City not found");
            }
            return this.cityRepository.update(input.id, input.data);
        }

        return this.cityRepository.create(input.data);
    }
}
