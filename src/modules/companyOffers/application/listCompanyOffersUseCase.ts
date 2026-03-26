// src/modules/companyOffers/application/listCompanyOffersUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { CompanyOfferRepository } from "../domain/repositories/companyOffer.repository";
import { PrismaCompanyOfferRepository } from "../infrastructure/persistence/PrismaCompanyOfferRepository";
import { companyOfferDtoResponseSchema } from "./dtos/companyOffer.dto";
import Joi from "joi";

interface PaginationParams {
    page: number;
    limit: number;
}

export class ListCompanyOffersUseCase extends UseCase<PaginationParams, { data: any[], total: number, page: number, limit: number }> {
    protected inputSchema: Joi.Schema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10)
    });
    protected outputSchema: Joi.Schema = Joi.object({
        data: Joi.array().items(companyOfferDtoResponseSchema),
        total: Joi.number().required(),
        page: Joi.number().required(),
        limit: Joi.number().required()
    }).options({ stripUnknown: true });
    private readonly companyOfferRepository: CompanyOfferRepository;

    constructor() {
        super();
        this.companyOfferRepository = new PrismaCompanyOfferRepository();
    }

    protected async implementation(params: PaginationParams): Promise<{ data: any[], total: number, page: number, limit: number }> {
        const { data, total } = await this.companyOfferRepository.findAllWithPagination(params.page, params.limit);
        return {
            data,
            total,
            page: params.page,
            limit: params.limit
        };
    }
}
