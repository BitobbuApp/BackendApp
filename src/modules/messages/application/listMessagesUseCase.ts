import { IMessageRepository } from '../domain/repositories/message.repository.interface';
import { IConversationRepository } from '../../conversations/domain/repositories/conversation.repository.interface';
import { Message } from '../domain/entities/message.entity';
import { UseCase } from '../../../shared/application/useCase';
import Joi from 'joi';

interface ListMessagesDto {
    conversationId: string;
    userId: string;
    limit: number;
    offset: number;
}

export class ListMessagesUseCase extends UseCase<ListMessagesDto, Message[]> {
    protected inputSchema: Joi.Schema = Joi.object({
        conversationId: Joi.string().uuid().required(),
        userId: Joi.string().uuid().required(),
        limit: Joi.number().integer().min(1).max(200).default(50),
        offset: Joi.number().integer().min(0).default(0)
    });
    
    protected outputSchema: Joi.Schema = Joi.any(); 

    constructor(
        private readonly messageRepository: IMessageRepository,
        private readonly conversationRepository: IConversationRepository
    ) {
        super();
    }

    protected async implementation(data: ListMessagesDto): Promise<Message[]> {
        // Optional: Validate that the user belongs to this conversation
        const conversation = await this.conversationRepository.findById(data.conversationId);
        if (!conversation) {
            throw new Error('Conversation not found');
        }
        
        if (conversation.participant_1_id !== data.userId && conversation.participant_2_id !== data.userId) {
            throw new Error('Forbidden: User does not belong to this conversation');
        }

        // Mark unread messages as read
        await this.messageRepository.markAsRead(data.conversationId, data.userId);
        await this.conversationRepository.resetUnreadCount(data.conversationId, data.userId);

        // Fetch history
        const messages = await this.messageRepository.listByConversation(data.conversationId, data.limit, data.offset);
        return messages;
    }
}
