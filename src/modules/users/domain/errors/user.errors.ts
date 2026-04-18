// src/modules/domain/userErrors.ts

import { ApplicationError } from "../../../../shared/domain/error";

export class UserNotFoundError extends ApplicationError {
    constructor(identifier: string) {
        super(404, `User ${identifier} not found`, "USER_NOT_FOUND", "NOT_FOUND");
    }
}

export class UserAlreadyExistsError extends ApplicationError {
    constructor(email: string) {
        super(409, `User with email ${email} already exists`, "USER_ALREADY_EXISTS", "CONFLICT");
    }
}

export class InvalidCredentialsError extends ApplicationError {
    constructor() {
        super(401, `Invalid email or password`, "USER_INVALID_CREDENTIALS", "AUTHENTICATION");
    }
}
