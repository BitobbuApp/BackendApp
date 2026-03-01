// src/shared/domain/errors.ts

export class ApplicationError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ValidationError extends ApplicationError {
    constructor(public messages: string[]) {
        super(400, "Validation Failed");
    }
}
