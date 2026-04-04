import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { listCompanySizesDtoResponseSchema } from "./dtos/companySize.dto";
import { CompanySizeRepository } from "../domain/repositories/companySize.repository";
import { PrismaCompanySizeRepository } from "../infrastructure/persistence/PrismaCompanySizeRepository";

export class ListCompanySizesUseCase extends UseCase<Record<string, never>, any> {
    protected inputSchema: Joi.Schema = Joi.object({});
    protected outputSchema: Joi.Schema = listCompanySizesDtoResponseSchema;
    private readonly companySizeRepository: CompanySizeRepository;

    constructor() {
        super();
        this.companySizeRepository = new PrismaCompanySizeRepository();
    }

    protected async implementation(): Promise<any> {
        return await this.companySizeRepository.list();
    }
}
