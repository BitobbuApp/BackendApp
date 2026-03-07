import { UseCase } from "../../../shared/application/useCase";
import { CompanyRepository } from "../domain/repositories/company.repository";
import { createCompanyDtoRequestSchema, createCompanyDtoResponseSchema } from "./dtos/company.dto";
import Joi from "joi";
import { CompanyAlreadyExistsError } from "../domain/errors/company.errors";

interface CreateCompanyInput {
    trade_name: string;
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

interface CreateCompanyOutput {
    id: string;
    trade_name: string;
    legal_name: string | null;
    tax_id: string | null;
    sector: string | null;
    logo_url: string | null;
    created_at: Date;
}

export class CreateCompanyUseCase extends UseCase<CreateCompanyInput, CreateCompanyOutput> {
    protected inputSchema: Joi.Schema = createCompanyDtoRequestSchema;
    protected outputSchema: Joi.Schema = createCompanyDtoResponseSchema;

    constructor(private readonly companyRepository: CompanyRepository) {
        super();
    }

    protected async implementation(data: CreateCompanyInput): Promise<CreateCompanyOutput> {
        // En un futuro podríamos validar que el tax_id no esté duplicado aquí si se provee
        if (data.tax_id) {
            const existing = await this.companyRepository.findByTaxId(data.tax_id);
            if (existing) {
                throw new CompanyAlreadyExistsError(data.tax_id);
            }
        }

        const company = await this.companyRepository.create(data);

        return {
            id: company.id,
            trade_name: company.trade_name,
            legal_name: company.legal_name,
            tax_id: company.tax_id,
            sector: company.sector,
            logo_url: company.logo_url,
            created_at: company.created_at!
        };
    }
}
