// src/modules/notifications/infrastructure/http/notificationRoutes.ts

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ListNotificationsUseCase } from '../../application/listNotificationsUseCase';
import { MarkNotificationReadUseCase } from '../../application/markNotificationReadUseCase';
import { MarkAllNotificationsReadUseCase } from '../../application/markAllNotificationsReadUseCase';

export async function notificationRoutes(app: FastifyInstance) {

    // ==========================================
    // GET /notifications
    // Returns paginated notifications for the authenticated company
    // ==========================================
    app.get('/', { preHandler: [authMiddleware] } as any, async (request: any, reply: FastifyReply) => {
        const useCase = new ListNotificationsUseCase();
        const query = request.query || {};
        const result = await useCase.execute({
            companyId: request.user.companyId,
            page: query.page ? parseInt(query.page, 10) : 1,
            limit: query.limit ? parseInt(query.limit, 10) : 20,
            onlyUnread: query.only_unread === 'true',
        });
        return ApiResponse.success(reply, result, 'Notifications retrieved');
    });

    // ==========================================
    // PATCH /notifications/:id/read
    // Marks a single notification as read
    // ==========================================
    app.patch('/:id/read', { preHandler: [authMiddleware] } as any, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        const useCase = new MarkNotificationReadUseCase();
        await useCase.execute({
            notificationId: request.params.id,
            companyId: (request as any).user.companyId,
        });
        return ApiResponse.success(reply, null, 'Notification marked as read');
    });

    // ==========================================
    // PATCH /notifications/read-all
    // Marks all notifications of the company as read
    // ==========================================
    app.patch('/read-all', { preHandler: [authMiddleware] } as any, async (request: any, reply: FastifyReply) => {
        const useCase = new MarkAllNotificationsReadUseCase();
        await useCase.execute({ companyId: request.user.companyId });
        return ApiResponse.success(reply, null, 'All notifications marked as read');
    });
}
