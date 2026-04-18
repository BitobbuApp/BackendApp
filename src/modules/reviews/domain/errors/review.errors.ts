import { ApplicationError } from "../../../../shared/domain/error";

export class ReviewNotFoundError extends ApplicationError {
    constructor(message: string = "Pending review not found") {
        super(404, message, "REVIEW_NOT_FOUND", "NOT_FOUND");
    }
}

export class ReviewUnauthorizedActorError extends ApplicationError {
    constructor(message: string = "You are not authorized for this review") {
        super(403, message, "REVIEW_UNAUTHORIZED_ACTOR", "AUTHORIZATION");
    }
}

export class ReviewAlreadySubmittedError extends ApplicationError {
    constructor(message: string = "You have already submitted your review") {
        super(400, message, "REVIEW_ALREADY_SUBMITTED", "BUSINESS");
    }
}

export class ReviewPeriodExpiredError extends ApplicationError {
    constructor(message: string = "The review period has expired") {
        super(400, message, "REVIEW_PERIOD_EXPIRED", "BUSINESS");
    }
}
