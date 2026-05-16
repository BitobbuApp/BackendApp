export class InvalidTransactionTransitionError extends Error {
    public readonly statusCode = 400;

    constructor(from: string, to: string) {
        super(`Invalid transaction status transition: "${from}" → "${to}" is not allowed.`);
        this.name = 'InvalidTransactionTransitionError';
    }
}
