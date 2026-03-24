// src/modules/companyOffers/application/deleteCompanyOfferUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { CompanyOfferRepository } from "../domain/repositories/companyOffer.repository";
import { PrismaCompanyOfferRepository } from "../infrastructure/persistence/PrismaCompanyOfferRepository";
import { CompanyOfferNotFoundError } from "../domain/errors/companyOffer.errors";
import Joi from "joi";

export class DeleteCompanyOfferUseCase extends UseCase<string, void> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = Joi.any();
    private readonly companyOfferRepository: CompanyOfferRepository;

    constructor() {
        super();
        this.companyOfferRepository = new PrismaCompanyOfferRepository();
    }

    protected async implementation(id: string): Promise<void> {
        const existingOffer = await this.companyOfferRepository.findById(id);
        if (!existingOffer) {
            throw new CompanyOfferNotFoundError(id);
        }

        await this.companyOfferRepository.delete(id);
    }
}
