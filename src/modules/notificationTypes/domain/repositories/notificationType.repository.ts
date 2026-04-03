import { NotificationType } from "../entities/notificationType.entity";

export interface NotificationTypeRepository {
    list(): Promise<NotificationType[]>;
}
