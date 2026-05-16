// src/modules/companies/application/getCompanyByIdUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { CompanyRepository } from "../domain/repositories/company.repository";
import Joi from "joi";
import { CompanyNotFoundError } from "../domain/errors/company.errors";

import { PrismaCompanyRepository } from "../infrastructure/persistence/PrismaCompanyRepository";

import { companyWithRelationsSchema } from "./dtos/company.dto";

export class GetCompanyByIdUseCase extends UseCase<string, any> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = companyWithRelationsSchema;

    private readonly companyRepository: CompanyRepository;

    constructor() {
        super();
        this.companyRepository = new PrismaCompanyRepository();
    }

    protected async implementation(id: string): Promise<any> {
        const company = await this.companyRepository.findById(id);
        if (!company) {
            throw new CompanyNotFoundError(id);
        }
        return company;
    }
}
