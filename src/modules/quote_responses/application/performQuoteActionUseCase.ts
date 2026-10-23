import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { getStrategy } from './strategies/QuoteRevisionStrategyFactory';
import { getIO } from '../../../shared/infrastructure/socket';
import { prisma } from '../../../shared/infrastructure/database';
import logger from '../../../shared/infrastructure/logger';
import { CreateSystemMessageUseCase } from '../../messages/application/createSystemMessageUseCase';
import { CreateNotificationUseCase } from '../../notifications/application/createNotificationUseCase';
import { NOTIFICATION_TYPE } from '../../notifications/domain/notificationTypes.constants';

interface PerformQuoteActionDto {
    quoteResponseId: string;
    action: string;
    actorCompanyId: string;
    payload?: Record<string, any>;
    rawFiles?: Array<{ file_name: string; buffer: Buffer; mime_type: string }>;
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
    'rejected',
    // 'expired' is intentionally not accepted here: it is a system action (ExpiredStrategy, future cron),
    // and exposing it would let any company expire someone else's quote.
];

const inputSchema = Joi.object({
    quoteResponseId: Joi.string().uuid().required(),
    action: Joi.string().valid(...VALID_ACTIONS).required(),
    actorCompanyId: Joi.string().uuid().required(),
    payload: Joi.object().optional().default({}),
    rawFiles: Joi.any().optional(),
}).options({ stripUnknown: true });

const outputSchema = Joi.object().unknown(true);

/** Actions that close the negotiation (the chat becomes read-only history). */
const NEGOTIATION_CLOSING_ACTIONS = ['rejected', 'canceled'];

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
    rejected: 'quote:rejected',
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
            payload: { ...data.payload, rawFiles: data.rawFiles },
        });

        // 2. See if there's a linked transaction (useful when action is 'accepted')
        //    and the negotiation conversation (useful to open the chat after 'negotiation_started')
        const [transaction, conversation] = await Promise.all([
            prisma.transaction.findUnique({
                where: { quote_response_id: data.quoteResponseId },
                select: { id: true },
            }),
            prisma.conversation.findFirst({
                where: { quote_response_id: data.quoteResponseId },
                select: { id: true },
            }),
        ]);

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
            conversation_id: conversation?.id ?? null,
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

            // Closing actions (buyer rejects / supplier withdraws) notify the counterparty even if no chat exists,
            // and their state event also goes to the counterparty's company room (it may not have the chat open)
            let counterpartyRoom: string | null = null;
            if (NEGOTIATION_CLOSING_ACTIONS.includes(data.action)) {
                counterpartyRoom = await this.notifyNegotiationClosed(data, result, conversation?.id ?? null);
            }

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
                // Notify the counterparty of whoever opened the negotiation:
                // the supplier when the buyer starts it, the buyer when the supplier starts it (direct RFQ)
                const startedBySupplier = data.actorCompanyId === result.supplier_id;
                let counterpartyId = result.supplier_id;
                if (startedBySupplier) {
                    const request = await prisma.request.findUniqueOrThrow({
                        where: { id: result.request_id },
                        select: { company_id: true },
                    });
                    counterpartyId = request.company_id;
                }

                // Emit to the counterparty's global room because they haven't joined the conversation yet!
                const counterpartyGlobalRoom = `company_${counterpartyId}`;
                io.to(counterpartyGlobalRoom).emit(eventName, {
                    ...payload,
                    actor_role: startedBySupplier ? 'supplier' : 'buyer',
                });
                logger.info(`📡 Socket event "${eventName}" emitted to counterparty global room: ${counterpartyGlobalRoom}`);

                // 🔔 Notify the counterparty
                const notifUC = new CreateNotificationUseCase();
                const notif = await notifUC.execute({
                    companyId: counterpartyId,
                    typeId: NOTIFICATION_TYPE.NEGOTIATION,
                    title: 'Nueva negociación',
                    message: startedBySupplier
                        ? 'Un proveedor respondió tu solicitud directa y abrió la negociación.'
                        : 'Un comprador quiere negociar tu oferta.',
                    link: `/Chat/${conversation.id}`,
                    entityType: 'quote_response',
                    entityId: data.quoteResponseId,
                });
                io.to(counterpartyGlobalRoom).emit('notification:new', {
                    id: notif.id,
                    title: notif.title,
                    message: notif.message,
                    link: notif.link,
                    createdAt: notif.createdAt,
                });
                logger.info(`🔔 Notification created for company ${counterpartyId} (negotiation_started)`);

            } else if (data.action === 'accepted') {
                io.to(conversation.id).emit(eventName, payload);
                logger.info(`📡 Socket event "${eventName}" emitted to conversation ${conversation.id}`);

                // 🔔 Notify the supplier that the buyer accepted
                const supplierRoom = `company_${result.supplier_id}`;
                const notifUC = new CreateNotificationUseCase();
                const notif = await notifUC.execute({
                    companyId: result.supplier_id,
                    typeId: NOTIFICATION_TYPE.QUOTE_ACCEPTED,
                    title: '¡Cotización aceptada!',
                    message: 'Un comprador aceptó tu propuesta de negociación.',
                    link: `/Chat/${conversation.id}`,
                    entityType: 'quote_response',
                    entityId: data.quoteResponseId,
                });
                io.to(supplierRoom).emit('notification:new', {
                    id: notif.id,
                    title: notif.title,
                    message: notif.message,
                    link: notif.link,
                    createdAt: notif.createdAt,
                });
                logger.info(`🔔 Notification created for supplier ${result.supplier_id} (quote_accepted)`);

            } else {
                // Normal flow: emit to the conversation room (+ the counterparty's company room for closing actions).
                // A single emit to several rooms reaches each socket only once.
                const rooms = counterpartyRoom ? [conversation.id, counterpartyRoom] : conversation.id;
                io.to(rooms).emit(eventName, payload);
                logger.info(`📡 Socket event "${eventName}" emitted to ${[rooms].flat().join(', ')}`);
            }

            // Create system message for ALL quote actions to have a detailed timeline
            const QUOTE_SYSTEM_KEYS: Record<string, string> = {
                negotiation_started: 'quote.negotiating',
                price_updated: 'quote.price_updated',
                quantity_updated: 'quote.quantity_updated',
                terms_updated: 'quote.terms_updated',
                formal_quote_requested: 'quote.formal_request',
                formal_quote_attached: 'quote.formal_attached',
                formal_quote_rejected: 'quote.formal_rejected',
                accepted: 'quote.accepted',
                canceled: 'quote.canceled',
                rejected: 'quote.rejected',
                expired: 'quote.expired'
            };

            const systemEventKey = QUOTE_SYSTEM_KEYS[data.action];

            if (systemEventKey) {
                // Extraer URL del archivo según la acción
                let fileUrl: string | undefined;
                let fileName: string | undefined;
                if (data.action === 'formal_quote_attached') {
                    fileUrl = result.formal_quote_url;
                    fileName = 'Cotización Formal.pdf';
                }

                const createSystemMessage = new CreateSystemMessageUseCase();
                await createSystemMessage.execute({
                    conversationId: conversation.id,
                    eventKey: systemEventKey,
                    eventPayload: {
                        actorId: data.actorCompanyId,
                        unitPriceUsd: Number(result.unit_price_usd),
                        quantity: Number(result.quantity),
                        fileUrl, // También en el payload para el frontend
                        ...data.payload // Include any specific action payload like new values or reasons
                    },
                    fileUrl, // Se persiste en Message.file_url
                    fileName,
                });
            }
        } catch (err) {
            // Socket errors should never break the API response
            logger.warn({ err }, `Failed to emit socket event for action "${data.action}"`);
        }
    }

    /**
     * 🔔 Tells the counterparty that the negotiation was closed:
     * - rejected (by the buyer)  → the supplier
     * - canceled (supplier withdrew) → the buyer
     * Returns the counterparty's company room.
     */
    private async notifyNegotiationClosed(data: PerformQuoteActionDto, result: any, conversationId: string | null): Promise<string> {
        const io = getIO();
        const request = await prisma.request.findUnique({
            where: { id: result.request_id },
            select: { product_service: true, company_id: true },
        });
        const reason = result.rejection_reason;
        const product = request?.product_service ? ` para "${request.product_service}"` : '';
        const withdrawn = data.action === 'canceled';

        const counterpartyId = withdrawn ? request!.company_id : result.supplier_id;
        const counterpartyRoom = `company_${counterpartyId}`;
        const notif = await new CreateNotificationUseCase().execute({
            companyId: counterpartyId,
            typeId: NOTIFICATION_TYPE.GENERAL,
            title: withdrawn ? 'El proveedor retiró su oferta' : 'Tu oferta fue rechazada',
            message: withdrawn
                ? `El proveedor retiró su oferta${product}. La negociación quedó cerrada.`
                : `El comprador rechazó tu oferta${product}.${reason ? ` Motivo: ${reason}` : ''}`,
            link: conversationId
                ? `/Chat/${conversationId}`
                : withdrawn ? `/Requests/${result.request_id}/summary` : '/PosiblesClientes',
            entityType: 'quote_response',
            entityId: data.quoteResponseId,
        });
        io.to(counterpartyRoom).emit('notification:new', {
            id: notif.id,
            title: notif.title,
            message: notif.message,
            link: notif.link,
            createdAt: notif.createdAt,
        });
        logger.info(`🔔 Notification created for company ${counterpartyId} (quote_${data.action})`);
        return counterpartyRoom;
    }
}
