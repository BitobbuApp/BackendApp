// src/modules/notifications/application/markNotificationReadUseCase.ts

import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { PrismaNotificationRepository } from '../infrastructure/persistence/PrismaNotificationRepository';

interface Input {
    notificationId: string;
    companyId: string;
}

export class MarkNotificationReadUseCase extends UseCase<Input, null> {
    protected inputSchema = Joi.object({
        notificationId: Joi.string().uuid().required(),
        companyId: Joi.string().uuid().required(),
    });
    protected outputSchema = Joi.valid(null);

    private readonly repo = new PrismaNotificationRepository();

    protected async implementation(data: Input): Promise<null> {
        await this.repo.markAsRead(data.notificationId, data.companyId);
        return null;
    }
}
