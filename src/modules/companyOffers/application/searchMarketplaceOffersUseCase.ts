// src/modules/companyOffers/application/searchMarketplaceOffersUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { CompanyOfferRepository } from "../domain/repositories/companyOffer.repository";
import { PrismaCompanyOfferRepository } from "../infrastructure/persistence/PrismaCompanyOfferRepository";
import { searchMarketplaceDtoRequestSchema, companyOfferDtoResponseSchema } from "./dtos/companyOffer.dto";
import Joi from "joi";

export class SearchMarketplaceOffersUseCase extends UseCase<any, { data: any[], total: number, page: number, limit: number }> {
    protected inputSchema: Joi.Schema = searchMarketplaceDtoRequestSchema;

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

    protected async implementation(filters: any): Promise<{ data: any[], total: number, page: number, limit: number }> {
        const pagination = {
            page: filters.page,
            limit: filters.limit
        };

        const { data, total } = await this.companyOfferRepository.searchMarketplace(filters, pagination);

        return {
            data,
            total,
            page: filters.page,
            limit: filters.limit
        };
    }
}
