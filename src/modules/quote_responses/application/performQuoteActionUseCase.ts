import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { getStrategy } from './strategies/QuoteRevisionStrategyFactory';
import { getIO } from '../../../shared/infrastructure/socket';
import { prisma } from '../../../shared/infrastructure/database';
import logger from '../../../shared/infrastructure/logger';

interface PerformQuoteActionDto {
    quoteResponseId: string;
    action: string;
    actorCompanyId: string;
    payload?: Record<string, any>;
}

const VALID_ACTIONS = [
    'negotiation_started',
    'price_updated',
    'quantity_updated',
    'terms_updated',
    'formal_quote_requested',
    'formal_quote_attached',
    'formal_quote_rejected',
    'accepted',
    'canceled',
    'expired',
];

const inputSchema = Joi.object({
    quoteResponseId: Joi.string().uuid().required(),
    action: Joi.string().valid(...VALID_ACTIONS).required(),
    actorCompanyId: Joi.string().uuid().required(),
    payload: Joi.object().optional().default({}),
}).options({ stripUnknown: true });

const outputSchema = Joi.object().unknown(true);

/**
 * Socket event map — maps each action to the event name emitted to the conversation room.
 */
const SOCKET_EVENTS: Record<string, string> = {
    negotiation_started: 'quote:negotiation_started',
    price_updated: 'quote:updated',
    quantity_updated: 'quote:updated',
    terms_updated: 'quote:updated',
    formal_quote_requested: 'quote:formal_requested',
    formal_quote_attached: 'quote:formal_attached',
    formal_quote_rejected: 'quote:formal_rejected',
    accepted: 'quote:accepted',
    canceled: 'quote:canceled',
    expired: 'quote:expired',
};

/**
 * PerformQuoteActionUseCase
 *
 * Single entry point for all quote response negotiation mutations.
 * Resolves the correct strategy via factory, delegates execution,
 * and emits a socket event to the conversation room on success.
 */
export class PerformQuoteActionUseCase extends UseCase<PerformQuoteActionDto, any> {
    protected inputSchema = inputSchema;
    protected outputSchema = outputSchema;

    protected async implementation(data: PerformQuoteActionDto): Promise<any> {
        const strategy = getStrategy(data.action);

        // 1. Execute the strategy (DB transaction)
        const result = await strategy.execute({
            quoteResponseId: data.quoteResponseId,
            actorCompanyId: data.actorCompanyId,
            payload: data.payload,
        });

        // 2. See if there's a linked transaction (useful when action is 'accepted')
        const transaction = await prisma.transaction.findUnique({
            where: { quote_response_id: data.quoteResponseId },
            select: { id: true },
        });

        // 3. Emit socket event
        this.emitSocketEvent(data, result, transaction?.id);

        // 4. Return response
        return {
            id: result.id,
            request_id: result.request_id,
            supplier_id: result.supplier_id,
            unit_price_usd: Number(result.unit_price_usd),
            quantity: Number(result.quantity),
            total_amount_usd: Number(result.total_amount_usd),
            status: result.status,
            formal_quote_url: result.formal_quote_url,
            delivery_time: result.delivery_time,
            notes: result.notes,
            has_guarantee: result.has_guarantee,
            payment_condition_id: result.payment_condition_id,
            delivery_method_id: result.delivery_method_id,
            rejection_reason: result.rejection_reason,
            transaction_id: transaction?.id,
            created_at: result.created_at,
            updated_at: result.updated_at,
        };
    }

    /**
     * Emits a real-time socket event to the conversation room
     * associated with this quote response.
     *
     * Non-blocking — socket failures never break the API response.
     */
    private async emitSocketEvent(data: PerformQuoteActionDto, result: any, transaction_id?: string): Promise<void> {
        try {
            const io = getIO();

            // Find the conversation linked to this quote response
            const conversation = await prisma.conversation.findFirst({
                where: { quote_response_id: data.quoteResponseId },
                select: { id: true, status: true },
            });

            if (!conversation) {
                logger.debug(`No conversation found for quote_response ${data.quoteResponseId}, skipping socket emit.`);
                return;
            }

            const eventName = SOCKET_EVENTS[data.action] || 'quote:updated';

            const payload = {
                quote_response_id: data.quoteResponseId,
                action: data.action,
                actor_company_id: data.actorCompanyId,
                status: result.status,
                conversation_status: conversation.status,
                unit_price_usd: Number(result.unit_price_usd),
                quantity: Number(result.quantity),
                total_amount_usd: Number(result.total_amount_usd),
                formal_quote_url: result.formal_quote_url,
                new_conversation_id: conversation.id, // Helpful for negotiation_started
                transaction_id: transaction_id,
                timestamp: new Date().toISOString(),
            };

            if (data.action === 'negotiation_started') {
                // Emit to the supplier's global room because they haven't joined the conversation yet!
                const supplierGlobalRoom = `company_${result.supplier_id}`;
                io.to(supplierGlobalRoom).emit(eventName, payload);
                logger.info(`📡 Socket event "${eventName}" emitted to supplier global room: ${supplierGlobalRoom}`);
            } else {
                // Normal flow: emit strictly strictly to the conversation room
                io.to(conversation.id).emit(eventName, payload);
                logger.info(`📡 Socket event "${eventName}" emitted to conversation ${conversation.id}`);
            }
        } catch (err) {
            // Socket errors should never break the API response
            logger.warn({ err }, `Failed to emit socket event for action "${data.action}"`);
        }
    }
}
