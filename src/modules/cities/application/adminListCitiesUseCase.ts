import { UseCase } from "../../../shared/application/useCase";
import { CityRepository } from "../domain/repositories/city.repository";
import { PrismaCityRepository } from "../infrastructure/persistence/PrismaCityRepository";
import { adminListCitiesInputSchema, listCitiesDtoResponseSchema } from "./dtos/city.dto";

interface AdminListCitiesInput {
    state_id?: number;
}

export class AdminListCitiesUseCase extends UseCase<AdminListCitiesInput, any> {
    protected inputSchema = adminListCitiesInputSchema;
    protected outputSchema = listCitiesDtoResponseSchema;
    private readonly cityRepository: CityRepository;

    constructor() {
        super();
        this.cityRepository = new PrismaCityRepository();
    }

    protected async implementation(input: AdminListCitiesInput): Promise<any> {
        return this.cityRepository.list(input?.state_id);
    }
}
