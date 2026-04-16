import { QuoteResponseNotFoundError } from "../../domain/errors/quote_response.errors";
import { ApplicationError } from "../../../../shared/domain/error";
import { QuoteRevisionStrategy } from './QuoteRevisionStrategy';
import { NegotiationStartedStrategy } from './NegotiationStartedStrategy';
import { PriceUpdatedStrategy } from './PriceUpdatedStrategy';
import { QuantityUpdatedStrategy } from './QuantityUpdatedStrategy';
import { TermsUpdatedStrategy } from './TermsUpdatedStrategy';
import { FormalQuoteRequestedStrategy } from './FormalQuoteRequestedStrategy';
import { FormalQuoteAttachedStrategy } from './FormalQuoteAttachedStrategy';
import { FormalQuoteRejectedStrategy } from './FormalQuoteRejectedStrategy';
import { AcceptedStrategy } from './AcceptedStrategy';
import { CanceledStrategy } from './CanceledStrategy';
import { ExpiredStrategy } from './ExpiredStrategy';

const STRATEGIES: Record<string, QuoteRevisionStrategy> = {
    negotiation_started: new NegotiationStartedStrategy(),
    price_updated: new PriceUpdatedStrategy(),
    quantity_updated: new QuantityUpdatedStrategy(),
    terms_updated: new TermsUpdatedStrategy(),
    formal_quote_requested: new FormalQuoteRequestedStrategy(),
    formal_quote_attached: new FormalQuoteAttachedStrategy(),
    formal_quote_rejected: new FormalQuoteRejectedStrategy(),
    accepted: new AcceptedStrategy(),
    canceled: new CanceledStrategy(),
    expired: new ExpiredStrategy(),
};

/**
 * Resolves the correct strategy for a given QuoteRevisionAction.
 * Throws if the action is unknown.
 */
export function getStrategy(action: string): QuoteRevisionStrategy {
    const strategy = STRATEGIES[action];
    if (!strategy) {
        throw new ApplicationError(400, `Unknown quote revision action: "${action}". Valid actions: ${Object.keys(STRATEGIES).join(', ')}`);
    }
    return strategy;
}
