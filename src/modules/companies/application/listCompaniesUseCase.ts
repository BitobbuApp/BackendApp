import { UseCase } from "../../../shared/application/useCase";
import { CompanyRepository } from "../domain/repositories/company.repository";
import { PrismaCompanyRepository } from "../infrastructure/persistence/PrismaCompanyRepository";
import { listCompaniesDtoResponseSchema } from "./dtos/company.dto";
import Joi from "joi";

interface ListCompaniesInput {
    sector?: string;
    interest?: string;
    page: number;
    limit: number;
}

export class ListCompaniesUseCase extends UseCase<ListCompaniesInput, any> {
    protected inputSchema: Joi.Schema = Joi.object({
        sector: Joi.string().optional(),
        interest: Joi.string().optional(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
    });
    protected outputSchema: Joi.Schema = listCompaniesDtoResponseSchema;
    private readonly companyRepository: CompanyRepository;

    constructor() {
        super();
        this.companyRepository = new PrismaCompanyRepository();
    }

    protected async implementation(input: ListCompaniesInput): Promise<any> {
        const { page, limit, ...filters } = input;
        const result = await this.companyRepository.list(filters, page, limit);

        return {
            data: result.data,
            total: result.total,
            page: result.page,
            limit: result.limit
        };
    }
}
