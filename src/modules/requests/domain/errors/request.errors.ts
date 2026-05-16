import { ApplicationError } from "../../../../shared/domain/error";

export class RequestNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Request with ID ${id} not found`, "REQUEST_NOT_FOUND", "NOT_FOUND");
    }
}
