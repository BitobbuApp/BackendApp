// src/modules/domain/userErrors.ts

import { ApplicationError } from "../../../../shared/domain/error";

export class UserNotFoundError extends ApplicationError {
    constructor(identifier: string) {
        super(404, `User ${identifier} not found`);
    }
}

export class UserAlreadyExistsError extends ApplicationError {
    constructor(email: string) {
        super(409, `User with email ${email} already exists`);
    }
}

export class InvalidCredentialsError extends ApplicationError {
    constructor() {
        super(401, `Invalid email or password`);
    }
}
