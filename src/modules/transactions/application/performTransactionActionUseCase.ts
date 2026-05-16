import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { getTransactionStrategy } from './strategies/TransactionStrategyFactory';
import { getIO } from '../../../shared/infrastructure/socket';
import { prisma } from '../../../shared/infrastructure/database';
import logger from '../../../shared/infrastructure/logger';
import { CreateSystemMessageUseCase } from '../../messages/application/createSystemMessageUseCase';
import { CreateNotificationUseCase } from '../../notifications/application/createNotificationUseCase';
import { NOTIFICATION_TYPE } from '../../notifications/domain/notificationTypes.constants';

interface PerformTransactionActionDto {
    transactionId: string;
    action: string;
    actorCompanyId: string;
    payload?: Record<string, any>;
    rawFiles?: Array<{ file_name: string; buffer: Buffer; mime_type: string }>;
}

const VALID_ACTIONS = [
    'payment_uploaded',
    'payment_approved',
    'payment_rejected',
    'order_shipped',
    'delivery_confirmed',
    'transaction_canceled',
    'dispute_raised',
];

const inputSchema = Joi.object({
    transactionId: Joi.string().uuid().required(),
    action: Joi.string().valid(...VALID_ACTIONS).required(),
    actorCompanyId: Joi.string().uuid().required(),
    payload: Joi.object().optional().default({}),
    rawFiles: Joi.any().optional(),
}).options({ stripUnknown: true });

const outputSchema = Joi.object().unknown(true);

/**
 * Socket event map for transaction actions.
 */
const SOCKET_EVENTS: Record<string, string> = {
    payment_uploaded: 'transaction:payment_uploaded',
    payment_approved: 'transaction:payment_approved',
    payment_rejected: 'transaction:payment_rejected',
    order_shipped: 'transaction:order_shipped',
    delivery_confirmed: 'transaction:delivery_confirmed',
    transaction_canceled: 'transaction:canceled',
    dispute_raised: 'transaction:dispute_raised',
};

/**
 * PerformTransactionActionUseCase
 *
 * Single entry point for all transaction state mutations.
 * Resolves the correct strategy via factory, delegates execution,
 * and emits a socket event to the conversation room on success.
 */
export class PerformTransactionActionUseCase extends UseCase<PerformTransactionActionDto, any> {
    protected inputSchema = inputSchema;
    protected outputSchema = outputSchema;

    // Preserve rawFiles outside of Joi since Buffer objects don't survive validation
    private _rawFiles: Array<{ file_name: string; buffer: Buffer; mime_type: string }> = [];

    public async execute(data: any): Promise<any> {
        this._rawFiles = data?.rawFiles || [];
        return super.execute(data);
    }

    protected async implementation(data: PerformTransactionActionDto): Promise<any> {
        const strategy = getTransactionStrategy(data.action);

        // 1. Execute the strategy (DB changes)
        const result = await strategy.execute({
            transactionId: data.transactionId,
            actorCompanyId: data.actorCompanyId,
            payload: { ...data.payload, rawFiles: this._rawFiles },
        });

        // 2. Emit socket event after successful commit
        this.emitSocketEvent(data, result);

        // 3. Return the response
        return {
            id: result.id,
            quote_response_id: result.quote_response_id,
            buyer_id: result.buyer_id,
            supplier_id: result.supplier_id,
            product_description: result.product_description,
            unit_price_usd: Number(result.unit_price_usd),
            quantity: Number(result.quantity),
            total_amount_usd: Number(result.total_amount_usd),
            status: result.status,
            buyer_confirmed: result.buyer_confirmed,
            supplier_confirmed: result.supplier_confirmed,
            estimated_delivery_date: result.estimated_delivery_date,
            actual_delivery_date: result.actual_delivery_date,
            cancellation_reason: result.cancellation_reason,
            created_at: result.created_at,
            updated_at: result.updated_at,
        };
    }

    /**
     * Emits a real-time socket event to the conversation room
     * associated with this transaction.
     */
    private async emitSocketEvent(data: PerformTransactionActionDto, result: any): Promise<void> {
        try {
            const io = getIO();

            // Find the conversation linked to this transaction
            const conversation = await prisma.conversation.findFirst({
                where: { transaction_id: data.transactionId },
                select: { id: true, status: true },
            });

            if (!conversation) {
                logger.debug(`No conversation found for transaction ${data.transactionId}, skipping socket emit.`);
                return;
            }

            const eventName = SOCKET_EVENTS[data.action] || 'transaction:updated';

            io.to(conversation.id).emit(eventName, {
                transaction_id: data.transactionId,
                action: data.action,
                actor_company_id: data.actorCompanyId,
                status: result.status,
                conversation_status: conversation.status,
                timestamp: new Date().toISOString(),
            });

            logger.info(`📡 Socket event "${eventName}" emitted to conversation ${conversation.id}`);

            // 🔔 Push notification to the OTHER party
            const notifUC = new CreateNotificationUseCase();

            if (data.action === 'payment_uploaded') {
                // Actor = buyer, notify = supplier
                const notif = await notifUC.execute({
                    companyId: result.supplier_id,
                    typeId: NOTIFICATION_TYPE.PAYMENT_UPLOADED,
                    title: 'Pago recibido',
                    message: 'Un comprador subió el comprobante de pago. Por favor revísalo.',
                    link: `/Negotiations/${conversation.id}`,
                    entityType: 'transaction',
                    entityId: data.transactionId,
                });
                io.to(`company_${result.supplier_id}`).emit('notification:new', {
                    id: notif.id, title: notif.title, message: notif.message,
                    link: notif.link, createdAt: notif.createdAt,
                });
                logger.info(`🔔 Notification → supplier ${result.supplier_id} (payment_uploaded)`);

            } else if (data.action === 'order_shipped') {
                // Actor = supplier, notify = buyer
                const notif = await notifUC.execute({
                    companyId: result.buyer_id,
                    typeId: NOTIFICATION_TYPE.ORDER_SHIPPED,
                    title: 'Pedido enviado',
                    message: 'El proveedor ha marcado tu pedido como enviado.',
                    link: `/Negotiations/${conversation.id}`,
                    entityType: 'transaction',
                    entityId: data.transactionId,
                });
                io.to(`company_${result.buyer_id}`).emit('notification:new', {
                    id: notif.id, title: notif.title, message: notif.message,
                    link: notif.link, createdAt: notif.createdAt,
                });
                logger.info(`🔔 Notification → buyer ${result.buyer_id} (order_shipped)`);

            } else if (data.action === 'delivery_confirmed') {
                // Actor = buyer, notify = supplier
                const notif = await notifUC.execute({
                    companyId: result.supplier_id,
                    typeId: NOTIFICATION_TYPE.DELIVERY_CONFIRMED,
                    title: 'Entrega confirmada ✅',
                    message: 'El comprador ha confirmado la recepción del pedido.',
                    link: `/Negotiations/${conversation.id}`,
                    entityType: 'transaction',
                    entityId: data.transactionId,
                });
                io.to(`company_${result.supplier_id}`).emit('notification:new', {
                    id: notif.id, title: notif.title, message: notif.message,
                    link: notif.link, createdAt: notif.createdAt,
                });
                logger.info(`🔔 Notification → supplier ${result.supplier_id} (delivery_confirmed)`);
            }
            const TRANSACTION_SYSTEM_KEYS: Record<string, string> = {
                payment_uploaded: 'transaction.payment_uploaded',
                payment_approved: 'transaction.payment_approved',
                payment_rejected: 'transaction.payment_rejected',
                order_shipped: 'transaction.order_shipped',
                delivery_confirmed: 'transaction.completed',
                transaction_canceled: 'transaction.canceled',
                dispute_raised: 'transaction.disputed'
            };

            const systemEventKey = TRANSACTION_SYSTEM_KEYS[data.action];
            
            if (systemEventKey) {
                let fileUrl: string | undefined;
                let fileName: string | undefined;
                if (data.action === 'payment_uploaded') {
                    fileUrl = result.payment_proof_url;
                    fileName = 'Comprobante de Pago';
                }

                const createSystemMessage = new CreateSystemMessageUseCase();
                await createSystemMessage.execute({
                    conversationId: conversation.id,
                    eventKey: systemEventKey,
                    eventPayload: {
                        actorId: data.actorCompanyId,
                        totalAmountUsd: Number(result.total_amount_usd),
                        fileUrl,
                        ...data.payload // Include reasons like cancellation or dispute details
                    },
                    fileUrl,
                    fileName,
                });
            }
        } catch (err) {
            logger.warn({ err }, `Failed to emit socket event for transaction action "${data.action}"`);
        }
    }
}
