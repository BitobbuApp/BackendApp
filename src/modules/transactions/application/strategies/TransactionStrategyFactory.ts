import { TransactionNotFoundError } from "../../domain/errors/transaction.errors";
import { TransactionStrategy } from './TransactionStrategy';
import { PaymentUploadedStrategy } from './PaymentUploadedStrategy';
import { PaymentApprovedStrategy } from './PaymentApprovedStrategy';
import { PaymentRejectedStrategy } from './PaymentRejectedStrategy';
import { OrderShippedStrategy } from './OrderShippedStrategy';
import { DeliveryConfirmedStrategy } from './DeliveryConfirmedStrategy';
import { TransactionCanceledStrategy } from './TransactionCanceledStrategy';
import { DisputeRaisedStrategy } from './DisputeRaisedStrategy';

const STRATEGIES: Record<string, TransactionStrategy> = {
    payment_uploaded: new PaymentUploadedStrategy(),
    payment_approved: new PaymentApprovedStrategy(),
    payment_rejected: new PaymentRejectedStrategy(),
    order_shipped: new OrderShippedStrategy(),
    delivery_confirmed: new DeliveryConfirmedStrategy(),
    transaction_canceled: new TransactionCanceledStrategy(),
    dispute_raised: new DisputeRaisedStrategy(),
};

/**
 * Resolves the correct strategy for a given transaction action.
 */
export function getTransactionStrategy(action: string): TransactionStrategy {
    const strategy = STRATEGIES[action];
    if (!strategy) {
        throw new Error(`Unknown transaction action: "${action}". Valid actions: ${Object.keys(STRATEGIES).join(', ')}`);
    }
    return strategy;
}
