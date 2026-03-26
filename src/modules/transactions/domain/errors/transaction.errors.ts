import { ApplicationError } from "../../../../shared/domain/error";

export class TransactionNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Transaction with ID ${id} not found`);
    }
}

export class DuplicateTransactionError extends ApplicationError {
    constructor(quoteResponseId: string) {
        super(409, `Transaction for quote response ID "${quoteResponseId}" already exists`);
    }
}
