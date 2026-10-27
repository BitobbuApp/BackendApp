// src/modules/companyOffers/application/deleteCompanyOfferUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { CompanyOfferRepository } from "../domain/repositories/companyOffer.repository";
import { PrismaCompanyOfferRepository } from "../infrastructure/persistence/PrismaCompanyOfferRepository";
import { CompanyOfferNotFoundError, CompanyOfferAccessDeniedError } from "../domain/errors/companyOffer.errors";
import Joi from "joi";

interface DeleteCompanyOfferDto {
    id: string;
    requester_company_id: string;
}

export class DeleteCompanyOfferUseCase extends UseCase<DeleteCompanyOfferDto, void> {
    protected inputSchema: Joi.Schema = Joi.object({
        id: Joi.string().uuid().required(),
        requester_company_id: Joi.string().uuid().required()
    });
    protected outputSchema: Joi.Schema = Joi.any();
    private readonly companyOfferRepository: CompanyOfferRepository;

    constructor() {
        super();
        this.companyOfferRepository = new PrismaCompanyOfferRepository();
    }

    protected async implementation({ id, requester_company_id }: DeleteCompanyOfferDto): Promise<void> {
        const existingOffer = await this.companyOfferRepository.findById(id);
        if (!existingOffer) {
            throw new CompanyOfferNotFoundError(id);
        }
        if (existingOffer.company_id !== requester_company_id) {
            throw new CompanyOfferAccessDeniedError(id);
        }

        await this.companyOfferRepository.delete(id);
    }
}
