// src/modules/notifications/domain/entities/notification.entity.ts

export class Notification {
    constructor(
        public id: string,
        public companyId: string,
        public userId: string | null,
        public typeId: number,
        public title: string,
        public message: string,
        public link: string | null,
        public isRead: boolean,
        public readAt: Date | null,
        public entityType: string | null,
        public entityId: string | null,
        public createdAt: Date,
    ) { }
}
