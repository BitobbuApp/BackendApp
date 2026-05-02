// src/modules/notifications/domain/repositories/notification.repository.ts

import { Notification } from '../entities/notification.entity';

export interface CreateNotificationData {
    companyId: string;
    userId?: string | null;
    typeId: number;
    title: string;
    message: string;
    link?: string | null;
    entityType?: string | null;
    entityId?: string | null;
}

export interface NotificationListResult {
    data: Notification[];
    total: number;
    page: number;
    limit: number;
    unreadCount: number;
}

export interface NotificationRepository {
    create(data: CreateNotificationData): Promise<Notification>;
    findByCompany(companyId: string, page: number, limit: number, onlyUnread?: boolean): Promise<NotificationListResult>;
    markAsRead(notificationId: string, companyId: string): Promise<void>;
    markAllAsRead(companyId: string): Promise<void>;
}
