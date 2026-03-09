import { UseCase } from "../../../shared/application/useCase";
import { RequestRepository } from "../domain/repositories/request.repository";
import { PrismaRequestRepository } from "../infrastructure/persistence/PrismaRequestRepository";
import { RequestNotFoundError } from "../domain/errors/request.errors";
import Joi from "joi";

export class DeleteRequestUseCase extends UseCase<string, void> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = Joi.any();
    private readonly requestRepository: RequestRepository;

    constructor() {
        super();
        this.requestRepository = new PrismaRequestRepository();
    }

    protected async implementation(id: string): Promise<void> {
        const existingRequest = await this.requestRepository.findById(id);
        if (!existingRequest) throw new RequestNotFoundError(id);

        await this.requestRepository.delete(id);
    }
}
