export class InvalidTransitionError extends Error {
    public readonly statusCode = 400;

    constructor(from: string, to: string) {
        super(`Invalid status transition: "${from}" → "${to}" is not allowed.`);
        this.name = 'InvalidTransitionError';
    }
}
