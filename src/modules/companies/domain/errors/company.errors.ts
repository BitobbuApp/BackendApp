import { ApplicationError } from "../../../../shared/domain/error";

export class CompanyNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Company with ID ${id} not found`);
    }
}

export class CompanyAlreadyExistsError extends ApplicationError {
    constructor(taxId: string) {
        super(409, `Company with Tax ID ${taxId} already exists`);
    }
}

export class LocationNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Location with ID ${id} not found`);
    }
}

export class ContactNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Contact with ID ${id} not found`);
    }
}
