// src/modules/companyOffers/application/getCompanyOfferByIdUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { CompanyOfferRepository } from "../domain/repositories/companyOffer.repository";
import { PrismaCompanyOfferRepository } from "../infrastructure/persistence/PrismaCompanyOfferRepository";
import { CompanyOfferNotFoundError } from "../domain/errors/companyOffer.errors";
import { companyOfferDtoResponseSchema } from "./dtos/companyOffer.dto";
import Joi from "joi";

export class GetCompanyOfferByIdUseCase extends UseCase<string, any> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = companyOfferDtoResponseSchema;
    private readonly companyOfferRepository: CompanyOfferRepository;

    constructor() {
        super();
        this.companyOfferRepository = new PrismaCompanyOfferRepository();
    }

    protected async implementation(id: string): Promise<any> {
        const offer = await this.companyOfferRepository.findById(id);
        if (!offer) throw new CompanyOfferNotFoundError(id);
        return offer;
    }
}
