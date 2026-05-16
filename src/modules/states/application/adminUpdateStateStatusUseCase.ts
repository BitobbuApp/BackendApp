import { UseCase } from "../../../shared/application/useCase";
import { StateRepository } from "../domain/repositories/state.repository";
import { PrismaStateRepository } from "../infrastructure/persistence/PrismaStateRepository";
import { adminUpdateStateStatusInputSchema, stateDtoResponseSchema } from "./dtos/state.dto";
import { ApplicationError } from "../../../shared/domain/error";

export class AdminUpdateStateStatusUseCase extends UseCase<any, any> {
    protected inputSchema = adminUpdateStateStatusInputSchema;
    protected outputSchema = stateDtoResponseSchema;
    private readonly stateRepository: StateRepository;

    constructor(stateRepository?: StateRepository) {
        super();
        this.stateRepository = stateRepository || new PrismaStateRepository();
    }

    protected async implementation(input: { id: number, status: boolean }): Promise<any> {
        const { id, status } = input;

        const exists = await this.stateRepository.findById(id);
        if (!exists) {
            throw new ApplicationError(404, "State not found");
        }

        return await this.stateRepository.update(id, { is_active: status });
    }
}
