// src/modules/notifications/infrastructure/persistence/PrismaNotificationRepository.ts

import { prisma } from '../../../../shared/infrastructure/database';
import {
    NotificationRepository,
    CreateNotificationData,
    NotificationListResult
} from '../../domain/repositories/notification.repository';
import { Notification } from '../../domain/entities/notification.entity';

export class PrismaNotificationRepository implements NotificationRepository {

    async create(data: CreateNotificationData): Promise<Notification> {
        const created = await prisma.notification.create({
            data: {
                company_id: data.companyId,
                user_id: data.userId ?? null,
                type_id: data.typeId,
                title: data.title,
                message: data.message,
                link: data.link ?? null,
                entity_type: data.entityType ?? null,
                entity_id: data.entityId ?? null,
            }
        });
        return this.mapToEntity(created);
    }

    async findByCompany(
        companyId: string,
        page: number = 1,
        limit: number = 20,
        onlyUnread: boolean = false
    ): Promise<NotificationListResult> {
        const skip = (page - 1) * limit;
        const where = {
            company_id: companyId,
            ...(onlyUnread ? { is_read: false } : {}),
        };

        const [total, unreadCount, data] = await Promise.all([
            prisma.notification.count({ where: { company_id: companyId } }),
            prisma.notification.count({ where: { company_id: companyId, is_read: false } }),
            prisma.notification.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
            }),
        ]);

        return {
            data: data.map(this.mapToEntity),
            total,
            page,
            limit,
            unreadCount,
        };
    }

    async markAsRead(notificationId: string, companyId: string): Promise<void> {
        await prisma.notification.updateMany({
            where: { id: notificationId, company_id: companyId },
            data: { is_read: true, read_at: new Date() },
        });
    }

    async markAllAsRead(companyId: string): Promise<void> {
        await prisma.notification.updateMany({
            where: { company_id: companyId, is_read: false },
            data: { is_read: true, read_at: new Date() },
        });
    }

    private mapToEntity(db: any): Notification {
        return new Notification(
            db.id,
            db.company_id,
            db.user_id ?? null,
            db.type_id,
            db.title,
            db.message,
            db.link ?? null,
            db.is_read,
            db.read_at ?? null,
            db.entity_type ?? null,
            db.entity_id ?? null,
            db.created_at,
        );
    }
}
