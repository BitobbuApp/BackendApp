import { ApplicationError } from "../../../../shared/domain/error";

export class ConversationNotFoundError extends ApplicationError {
    constructor(id: string) {
        super(404, `Conversation with ID ${id} not found`);
    }
}

export class ConversationAccessDeniedError extends ApplicationError {
    constructor(id: string) {
        super(403, `Forbidden: conversation ${id} does not belong to the authenticated company`);
    }
}
