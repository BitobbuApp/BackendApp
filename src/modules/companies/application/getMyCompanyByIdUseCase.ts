// src/modules/companies/application/getCompanyByIdUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { CompanyRepository } from "../domain/repositories/company.repository";
import Joi from "joi";
import { CompanyNotFoundError } from "../domain/errors/company.errors";

import { PrismaCompanyRepository } from "../infrastructure/persistence/PrismaCompanyRepository";

export class GetMyCompanyByIdUseCase extends UseCase<string, any> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = Joi.object({
        id: Joi.string().required(),
        trade_name: Joi.string().required(),
        legal_name: Joi.string().allow(null, ''),
        tax_id: Joi.string().allow(null, ''),
        bio: Joi.string().allow(null, ''),
        logo_url: Joi.string().allow(null, ''),
        sector: Joi.string().allow(null),
        founding_year: Joi.number().optional().allow(null, ''),
        company_type: Joi.string().allow(null),
        can_buy: Joi.boolean().required(),
        can_sell: Joi.boolean().required(),
        approximate_volume: Joi.string().allow(null),
        average_rating: Joi.number().required(),
        monthly_transactions_id: Joi.string().optional().allow(null, ''),
        company_size_id: Joi.string().optional().allow(null, ''),
        transaction_count: Joi.number().required(),
        review_count: Joi.number().required(),
        created_at: Joi.date().required(),
        // Joined fields
        locations: Joi.array().items(Joi.any()).optional(),
        contacts: Joi.array().items(Joi.any()).optional(),
        commercial_profile: Joi.any().optional(),
        settings: Joi.any().optional(),
        payment_methods: Joi.array().items(Joi.any()).optional(),
        categories_of_interest: Joi.array().items(Joi.any()).optional(),
    }).options({ stripUnknown: true });

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
