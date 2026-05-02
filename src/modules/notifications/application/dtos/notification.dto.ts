// src/modules/notifications/application/dtos/notification.dto.ts
import Joi from 'joi';

export const notificationOutputSchema = Joi.object({
    id: Joi.string().uuid().required(),
    companyId: Joi.string().uuid().required(),
    userId: Joi.string().uuid().allow(null).optional(),
    typeId: Joi.number().integer().required(),
    title: Joi.string().required(),
    message: Joi.string().required(),
    link: Joi.string().allow(null).optional(),
    isRead: Joi.boolean().required(),
    readAt: Joi.date().allow(null).optional(),
    entityType: Joi.string().allow(null).optional(),
    entityId: Joi.string().uuid().allow(null).optional(),
    createdAt: Joi.date().required(),
}).options({ allowUnknown: false });

export const notificationListOutputSchema = Joi.object({
    data: Joi.array().items(notificationOutputSchema).required(),
    total: Joi.number().integer().required(),
    page: Joi.number().integer().required(),
    limit: Joi.number().integer().required(),
    unreadCount: Joi.number().integer().required(),
});
