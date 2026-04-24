import { ApplicationError } from "../../../../shared/domain/error";

export class QuoteResponseNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Quote response with ID ${id} not found`, "QUOTE_RESPONSE_NOT_FOUND", "NOT_FOUND");
    }
}

export class DuplicateQuoteResponseError extends ApplicationError {
    constructor(requestId: string, supplierId: string) {
        super(409, `Quote response for request ${requestId} by supplier ${supplierId} already exists`, "QUOTE_RESPONSE_DUPLICATE", "CONFLICT");
    }
}

export class InvalidTransitionError extends ApplicationError {
    constructor(message: string = "Invalid quote response transition") {
        super(409, message, "QUOTE_RESPONSE_INVALID_TRANSITION", "CONFLICT");
    }
}

export class UnauthorizedActorError extends ApplicationError {
    constructor(message: string = "Unauthorized actor for this quote response") {
        super(403, message, "QUOTE_RESPONSE_UNAUTHORIZED_ACTOR", "AUTHORIZATION");
    }
}
