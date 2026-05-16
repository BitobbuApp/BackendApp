import { ApplicationError } from "../../../../shared/domain/error";

export class TransactionNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Transaction with ID ${id} not found`, "TRANSACTION_NOT_FOUND", "NOT_FOUND");
    }
}

export class DuplicateTransactionError extends ApplicationError {
    constructor(quoteResponseId: string) {
        super(409, `Transaction for quote response ID "${quoteResponseId}" already exists`, "TRANSACTION_DUPLICATE", "CONFLICT");
    }
}

export class InvalidTransitionError extends ApplicationError {
    constructor(message: string = "Invalid transaction transition") {
        super(409, message, "TRANSACTION_INVALID_TRANSITION", "CONFLICT");
    }
}

export class UnauthorizedActorError extends ApplicationError {
    constructor(message: string = "Unauthorized actor for this transaction") {
        super(403, message, "TRANSACTION_UNAUTHORIZED_ACTOR", "AUTHORIZATION");
    }
}
