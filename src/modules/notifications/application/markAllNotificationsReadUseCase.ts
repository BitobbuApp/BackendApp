// src/modules/notifications/application/markAllNotificationsReadUseCase.ts

import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { PrismaNotificationRepository } from '../infrastructure/persistence/PrismaNotificationRepository';

interface Input {
    companyId: string;
}

export class MarkAllNotificationsReadUseCase extends UseCase<Input, null> {
    protected inputSchema = Joi.object({
        companyId: Joi.string().uuid().required(),
    });
    protected outputSchema = Joi.valid(null);

    private readonly repo = new PrismaNotificationRepository();

    protected async implementation(data: Input): Promise<null> {
        await this.repo.markAllAsRead(data.companyId);
        return null;
    }
}
