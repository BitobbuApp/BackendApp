// src/modules/companyOffers/domain/errors/companyOffer.errors.ts
import { ApplicationError } from "../../../../shared/domain/error";

export class CompanyOfferNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Company Offer with ID ${id} not found`);
    }
}
