import { ErrorCode, ErrorCategory } from './error-codes';

export class ApplicationError extends Error {
    public code: ErrorCode;
    public category: ErrorCategory;
    public details: any;
    public isOperational: boolean;

    constructor(
        public statusCode: number,
        message: string,
        code: ErrorCode = "INTERNAL_SERVER_ERROR",
        category: ErrorCategory = "INTERNAL",
        details: any = null,
        isOperational: boolean = true
    ) {
        super(message);
        this.name = this.constructor.name;
        this.code = code;
        this.category = category;
        this.details = details;
        this.isOperational = isOperational;
    }
}

export class ValidationError extends ApplicationError {
    constructor(public messages: string[]) {
        super(400, "Validation Failed", "VALIDATION_ERROR", "VALIDATION", messages);
    }
}