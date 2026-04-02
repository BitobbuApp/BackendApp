import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { listVerifDocTypesDtoResponseSchema } from "./dtos/verifDocType.dto";
import { VerifDocTypeRepository } from "../domain/repositories/verifDocType.repository";
import { PrismaVerifDocTypeRepository } from "../infrastructure/persistence/PrismaVerifDocTypeRepository";

export class ListVerifDocTypesUseCase extends UseCase<Record<string, never>, any> {
    protected inputSchema: Joi.Schema = Joi.object({});
    protected outputSchema: Joi.Schema = listVerifDocTypesDtoResponseSchema;
    private readonly verifDocTypeRepository: VerifDocTypeRepository;

    constructor() {
        super();
        this.verifDocTypeRepository = new PrismaVerifDocTypeRepository();
    }

    protected async implementation(): Promise<any> {
        return await this.verifDocTypeRepository.list();
    }
}
