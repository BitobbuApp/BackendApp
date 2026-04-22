import { ApplicationError } from '../error';

export class StorageServiceException extends ApplicationError {
    constructor(
        message: string,
        details?: any,
    ) {
        super(500, message, "INTERNAL_SERVER_ERROR", "INFRASTRUCTURE", details, false);
        this.name = this.constructor.name;
    }
}
