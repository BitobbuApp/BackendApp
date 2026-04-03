import { ApplicationError } from "../../../../shared/domain/error";

export class MessageAccessDeniedError extends ApplicationError {
    constructor(conversationId: string) {
        super(403, `Forbidden: conversation ${conversationId} does not belong to the authenticated company`);
    }
}
