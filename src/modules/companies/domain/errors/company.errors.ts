import { ApplicationError } from "../../../../shared/domain/error";

export class CompanyNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Company with ID ${id} not found`, "COMPANY_NOT_FOUND", "NOT_FOUND");
    }
}

export class CompanyAlreadyExistsError extends ApplicationError {
    constructor(taxId: string) {
        super(409, `Company with Tax ID ${taxId} already exists`, "COMPANY_ALREADY_EXISTS", "CONFLICT");
    }
}

export class LocationNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Location with ID ${id} not found`, "LOCATION_NOT_FOUND", "NOT_FOUND");
    }
}

export class ContactNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Contact with ID ${id} not found`, "CONTACT_NOT_FOUND", "NOT_FOUND");
    }
}

export class PrimaryContactDeleteForbiddenError extends ApplicationError {
    constructor() {
        super(409, "Cannot delete the primary contact. Please assign another contact as primary first.", "COMPANY_PRIMARY_CONTACT_DELETE_FORBIDDEN", "CONFLICT");
    }
}

export class MainHeadquartersDeleteForbiddenError extends ApplicationError {
    constructor() {
        super(409, "Cannot delete the main headquarters. Please assign another location as main first.", "COMPANY_MAIN_HEADQUARTERS_DELETE_FORBIDDEN", "CONFLICT");
    }
}
