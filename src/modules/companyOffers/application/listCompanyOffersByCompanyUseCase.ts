// src/modules/companyOffers/application/listCompanyOffersByCompanyUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { CompanyOfferRepository } from "../domain/repositories/companyOffer.repository";
import { PrismaCompanyOfferRepository } from "../infrastructure/persistence/PrismaCompanyOfferRepository";
import { companyOfferListDtoResponseSchema } from "./dtos/companyOffer.dto";
import Joi from "joi";

export class ListCompanyOffersByCompanyUseCase extends UseCase<string, any[]> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = companyOfferListDtoResponseSchema;
    private readonly companyOfferRepository: CompanyOfferRepository;

    constructor() {
        super();
        this.companyOfferRepository = new PrismaCompanyOfferRepository();
    }

    protected async implementation(companyId: string): Promise<any[]> {
        return await this.companyOfferRepository.findByCompanyId(companyId);
    }
}
