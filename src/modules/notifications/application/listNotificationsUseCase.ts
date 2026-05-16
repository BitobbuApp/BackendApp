// src/modules/notifications/application/listNotificationsUseCase.ts

import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { PrismaNotificationRepository } from '../infrastructure/persistence/PrismaNotificationRepository';
import { notificationListOutputSchema } from './dtos/notification.dto';

interface Input {
    companyId: string;
    page?: number;
    limit?: number;
    onlyUnread?: boolean;
}

export class ListNotificationsUseCase extends UseCase<Input, any> {
    protected inputSchema = Joi.object({
        companyId: Joi.string().uuid().required(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(50).default(20),
        onlyUnread: Joi.boolean().default(false),
    });
    protected outputSchema = notificationListOutputSchema;

    private readonly repo = new PrismaNotificationRepository();

    protected async implementation(data: Input): Promise<any> {
        const result = await this.repo.findByCompany(
            data.companyId,
            data.page ?? 1,
            data.limit ?? 20,
            data.onlyUnread ?? false,
        );

        // Map entity fields to camelCase DTO
        return {
            ...result,
            data: result.data.map(n => ({
                id: n.id,
                companyId: n.companyId,
                userId: n.userId,
                typeId: n.typeId,
                title: n.title,
                message: n.message,
                link: n.link,
                isRead: n.isRead,
                readAt: n.readAt,
                entityType: n.entityType,
                entityId: n.entityId,
                createdAt: n.createdAt,
            })),
        };
    }
}
