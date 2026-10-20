import { ApplicationError } from "../../../../shared/domain/error";

export class RequestNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Request with ID ${id} not found`, "REQUEST_NOT_FOUND", "NOT_FOUND");
    }
}

export class RequestAccessDeniedError extends ApplicationError {
    constructor(id: string) {
        super(403, `Forbidden: request ${id} is a direct request for another company`, "REQUEST_ACCESS_DENIED", "AUTHORIZATION");
    }
}

export class DirectRequestSelfTargetError extends ApplicationError {
    constructor() {
        super(400, "A company cannot send a direct request to its own offer", "DIRECT_REQUEST_SELF_TARGET", "BUSINESS");
    }
}
