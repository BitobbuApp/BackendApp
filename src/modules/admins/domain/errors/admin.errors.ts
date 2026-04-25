import { ApplicationError } from "../../../../shared/domain/error";

export class AdminInvalidCredentialsError extends ApplicationError {
    constructor() {
        super(401, "Invalid email or password", "AUTH_INVALID_TOKEN", "AUTHENTICATION");
    }
}

export class AdminInactiveError extends ApplicationError {
    constructor() {
        super(403, "Admin account is inactive or locked", "AUTHORIZATION_ERROR", "AUTHORIZATION");
    }
}

export class AdminNotFoundError extends ApplicationError {
    constructor() {
        super(404, "Admin not found", "RESOURCE_NOT_FOUND", "NOT_FOUND");
    }
}
