// src/modules/notifications/application/createNotificationUseCase.ts
//
// INTERNAL USE CASE — called by other use cases (not directly via HTTP).
// Returns the raw Notification entity without going through the UseCase base class
// (avoids double-serialization overhead and is not user-facing).

import { PrismaNotificationRepository } from '../infrastructure/persistence/PrismaNotificationRepository';
import { Notification } from '../domain/entities/notification.entity';
import { CreateNotificationData } from '../domain/repositories/notification.repository';

export class CreateNotificationUseCase {
    private readonly repo = new PrismaNotificationRepository();

    async execute(data: CreateNotificationData): Promise<Notification> {
        return this.repo.create(data);
    }
}
