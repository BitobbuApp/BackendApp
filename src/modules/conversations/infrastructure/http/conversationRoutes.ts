import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PrismaConversationRepository } from '../persistence/PrismaConversationRepository';
import { ListUserConversationsUseCase } from '../../application/listUserConversationsUseCase';
import { listConversationsQuerySchema } from '../../application/dtos/conversation.dto';
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ApiResponse } from '../../../../shared/infrastructure/http/responseFormatter';

export async function conversationRoutes(app: FastifyInstance) {
    const conversationRepository = new PrismaConversationRepository();
    const listUserConversationsUseCase = new ListUserConversationsUseCase(conversationRepository);

    app.get('/', {
        preHandler: [authMiddleware] as any,
        preValidation: async (request: FastifyRequest, reply: FastifyReply) => {
            // Validate query
            const { error } = listConversationsQuerySchema.validate(request.query);
            if (error) {
                return ApiResponse.error(reply, error.details?.[0]?.message || 'Validation error', 400);
            }
        }
    }, async (request: FastifyRequest, reply: FastifyReply) => {
        try {
            const user = (request as any).user;
            
            // Extract the user's company ID (assuming the user object has companyId in your JWT setup)
            // For now, if the token directly provides the company/user ID used in participant_id:
            const userId = user.companyId || user.userId;

            const conversations = await listUserConversationsUseCase.execute({ userId });
            return ApiResponse.success(reply, conversations, "Conversations retrieved successfully", 200);
        } catch (error: any) {
            app.log.error(error);
            return ApiResponse.error(reply, 'Internal Server Error', 500);
        }
    });
}
