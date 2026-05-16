// src/modules/notifications/domain/notificationTypes.constants.ts
//
// Canonical IDs for the notification_types table.
// Must match the seed in: prisma/seeds/notification_types.sql

export const NOTIFICATION_TYPE = {
    /** Comprador inició negociación — notificar al Proveedor */
    NEGOTIATION: 1,
    /** Comprador aceptó cotización formal — notificar al Proveedor */
    QUOTE_ACCEPTED: 2,
    /** Comprador subió comprobante de pago — notificar al Proveedor */
    PAYMENT_UPLOADED: 3,
    /** Proveedor marcó pedido como enviado — notificar al Comprador */
    ORDER_SHIPPED: 4,
    /** Comprador confirmó recepción del pedido — notificar al Proveedor */
    DELIVERY_CONFIRMED: 5,
    /** Uso general */
    GENERAL: 6,
} as const;
