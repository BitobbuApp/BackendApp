import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { listCompanyTypesDtoResponseSchema } from "./dtos/companyType.dto";
import { CompanyTypeRepository } from "../domain/repositories/companyType.repository";
import { PrismaCompanyTypeRepository } from "../infrastructure/persistence/PrismaCompanyTypeRepository";

export class ListCompanyTypesUseCase extends UseCase<Record<string, never>, any> {
    protected inputSchema: Joi.Schema = Joi.object({});
    protected outputSchema: Joi.Schema = listCompanyTypesDtoResponseSchema;
    private readonly companyTypeRepository: CompanyTypeRepository;

    constructor() {
        super();
        this.companyTypeRepository = new PrismaCompanyTypeRepository();
    }

    protected async implementation(): Promise<any> {
        return await this.companyTypeRepository.list();
    }
}
