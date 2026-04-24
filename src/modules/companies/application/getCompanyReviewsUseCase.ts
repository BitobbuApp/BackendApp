import { CompanyRepository } from "../domain/repositories/company.repository";
import { PrismaCompanyRepository } from "../infrastructure/persistence/PrismaCompanyRepository";
import { UseCase } from "../../../shared/application/useCase";
import Joi from 'joi';

export const getCompanyReviewsDtoRequestSchema = Joi.object({
    id: Joi.string().uuid().required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
});

interface GetCompanyReviewsInput {
    id: string;
    page: number;
    limit: number;
}

export class GetCompanyReviewsUseCase extends UseCase<GetCompanyReviewsInput, any> {
    protected inputSchema: Joi.Schema = getCompanyReviewsDtoRequestSchema;
    protected outputSchema: Joi.Schema = Joi.object({
        items: Joi.array().required(),
        total: Joi.number().required()
    }).required();
    private readonly companyRepository: CompanyRepository;

    constructor() {
        super();
        this.companyRepository = new PrismaCompanyRepository();
    }

    protected async implementation(input: GetCompanyReviewsInput): Promise<any> {
        return await this.companyRepository.getReviews(input.id, input.page, input.limit);
    }
}
