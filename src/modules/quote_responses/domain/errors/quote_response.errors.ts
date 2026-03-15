import { ApplicationError } from "../../../../shared/domain/error";

export class QuoteResponseNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Quote response with ID ${id} not found`);
    }
}

export class DuplicateQuoteResponseError extends ApplicationError {
    constructor(requestId: string, supplierId: string) {
        super(409, `Quote response for request ${requestId} by supplier ${supplierId} already exists`);
    }
}
