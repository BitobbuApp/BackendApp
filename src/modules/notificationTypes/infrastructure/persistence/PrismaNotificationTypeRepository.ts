import { prisma } from "../../../../shared/infrastructure/database";
import { NotificationType } from "../../domain/entities/notificationType.entity";
import { NotificationTypeRepository } from "../../domain/repositories/notificationType.repository";

export class PrismaNotificationTypeRepository implements NotificationTypeRepository {
    async list(): Promise<NotificationType[]> {
        const items = await prisma.notificationTypeDict.findMany({
            where: { is_active: true },
            orderBy: { name: "asc" }
        });

        return items.map((item) => this.mapToEntity(item));
    }

    private mapToEntity(db: any): NotificationType {
        return new NotificationType(
            db.id,
            db.name,
            db.is_active,
            db.icon ?? null
        );
    }
}
