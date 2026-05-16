import { UseCase } from "../../../shared/application/useCase";
import { StateRepository } from "../domain/repositories/state.repository";
import { PrismaStateRepository } from "../infrastructure/persistence/PrismaStateRepository";
import { listStatesByCountryDtoResponseSchema, adminListStatesInputSchema } from "./dtos/state.dto";

export class AdminListStatesUseCase extends UseCase<any, any> {
    protected inputSchema = adminListStatesInputSchema;
    protected outputSchema = listStatesByCountryDtoResponseSchema;
    private readonly stateRepository: StateRepository;

    constructor(stateRepository?: StateRepository) {
        super();
        this.stateRepository = stateRepository || new PrismaStateRepository();
    }

    protected async implementation(filters?: { country_id?: number }): Promise<any> {
        return await this.stateRepository.findAll(filters);
    }
}
