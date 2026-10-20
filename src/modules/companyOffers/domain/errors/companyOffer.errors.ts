// src/modules/companyOffers/domain/errors/companyOffer.errors.ts
import { ApplicationError } from "../../../../shared/domain/error";

export class CompanyOfferNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Company Offer with ID ${id} not found`);
    }
}

export class CompanyOfferAccessDeniedError extends ApplicationError {
    constructor(id: string) {
        super(403, `Forbidden: company offer ${id} does not belong to the authenticated company`, "COMPANY_OFFER_ACCESS_DENIED", "AUTHORIZATION");
    }
}
