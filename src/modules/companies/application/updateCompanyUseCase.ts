import { UseCase } from "../../../shared/application/useCase";
import { CompanyRepository } from "../domain/repositories/company.repository";
import { updateCompanyDtoRequestSchema, createCompanyDtoResponseSchema } from "./dtos/company.dto";
import Joi from "joi";
import { CompanyNotFoundError } from "../domain/errors/company.errors";
import { Company } from "../domain/entities/company.entity";

interface UpdateCompanyInput {
    id: string;
    trade_name?: string;
    legal_name?: string;
    tax_id?: string;
    founding_year?: number;
    bio?: string;
    logo_url?: string;
    sector?: any;
    company_type?: any;
    interest?: any;
    approximate_volume?: any;
}

export class UpdateCompanyUseCase extends UseCase<UpdateCompanyInput, any> {
    protected inputSchema: Joi.Schema = updateCompanyDtoRequestSchema.keys({
        id: Joi.string().uuid().required()
    });
    protected outputSchema: Joi.Schema = createCompanyDtoResponseSchema;

    constructor(private readonly companyRepository: CompanyRepository) {
        super();
    }

    protected async implementation(data: UpdateCompanyInput): Promise<any> {
        const { id, ...updateData } = data;

        const existing = await this.companyRepository.findById(id);
        if (!existing) {
            throw new CompanyNotFoundError(id);
        }

        const updatedCompany = await this.companyRepository.update(id, updateData);

        return {
            id: updatedCompany.id,
            trade_name: updatedCompany.trade_name,
            legal_name: updatedCompany.legal_name,
            tax_id: updatedCompany.tax_id,
            sector: updatedCompany.sector,
            logo_url: updatedCompany.logo_url,
            created_at: updatedCompany.created_at!
        };
    }
}
