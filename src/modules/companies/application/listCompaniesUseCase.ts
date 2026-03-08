import { UseCase } from "../../../shared/application/useCase";
import { CompanyRepository } from "../domain/repositories/company.repository";
import { PrismaCompanyRepository } from "../infrastructure/persistence/PrismaCompanyRepository";
import { listCompaniesDtoResponseSchema } from "./dtos/company.dto";
import Joi from "joi";

export class ListCompaniesUseCase extends UseCase<any, any[]> {
    protected inputSchema: Joi.Schema = Joi.object({
        sector: Joi.string().optional(),
        interest: Joi.string().optional()
    }).optional();
    protected outputSchema: Joi.Schema = listCompaniesDtoResponseSchema;
    private readonly companyRepository: CompanyRepository;

    constructor() {
        super();
        this.companyRepository = new PrismaCompanyRepository();
    }

    protected async implementation(filters: any): Promise<any[]> {
        const companies = await this.companyRepository.list(filters);

        return companies.map(c => ({
            id: c.id,
            trade_name: c.trade_name,
            legal_name: c.legal_name,
            tax_id: c.tax_id,
            sector: c.sector,
            logo_url: c.logo_url,
            created_at: c.created_at!
        }));
    }
}
