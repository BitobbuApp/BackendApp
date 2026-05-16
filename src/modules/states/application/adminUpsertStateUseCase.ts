import { UseCase } from "../../../shared/application/useCase";
import { StateRepository } from "../domain/repositories/state.repository";
import { PrismaStateRepository } from "../infrastructure/persistence/PrismaStateRepository";
import { adminUpsertStateInputSchema, stateDtoResponseSchema } from "./dtos/state.dto";
import { ApplicationError } from "../../../shared/domain/error";

export class AdminUpsertStateUseCase extends UseCase<any, any> {
    protected inputSchema = adminUpsertStateInputSchema;
    protected outputSchema = stateDtoResponseSchema;
    private readonly stateRepository: StateRepository;

    constructor(stateRepository?: StateRepository) {
        super();
        this.stateRepository = stateRepository || new PrismaStateRepository();
    }

    protected async implementation(input: { id?: number, data: any }): Promise<any> {
        const { id, data } = input;

        if (id) {
            const exists = await this.stateRepository.findById(id);
            if (!exists) {
                throw new ApplicationError(404, "State not found");
            }
            return await this.stateRepository.update(id, data);
        } else {
            return await this.stateRepository.create(data);
        }
    }
}
