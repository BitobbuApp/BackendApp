import { IMessageRepository } from '../domain/repositories/message.repository.interface';
import { IConversationRepository } from '../../conversations/domain/repositories/conversation.repository.interface';
import { PrismaConversationRepository } from '../../conversations/infrastructure/persistence/PrismaConversationRepository';
import { PrismaMessageRepository } from '../infrastructure/persistence/PrismaMessageRepository';
import { Message } from '../domain/entities/message.entity';
import { UseCase } from '../../../shared/application/useCase';
import Joi from 'joi';
import { listMessagesDtoRequestSchema, messageListDtoResponseSchema } from './dtos/message.dto';
import { ConversationAccessDeniedError, ConversationNotFoundError } from '../../conversations/domain/errors/conversation.errors';

interface ListMessagesDto {
    conversation_id: string;
    requester_company_id: string;
    limit: number;
    offset: number;
}

export class ListMessagesUseCase extends UseCase<ListMessagesDto, Message[]> {
    protected inputSchema: Joi.Schema = listMessagesDtoRequestSchema;
    protected outputSchema: Joi.Schema = messageListDtoResponseSchema;
    private readonly messageRepository: IMessageRepository;
    private readonly conversationRepository: IConversationRepository;

    constructor(
        messageRepository?: IMessageRepository,
        conversationRepository?: IConversationRepository
    ) {
        super();
        this.messageRepository = messageRepository ?? new PrismaMessageRepository();
        this.conversationRepository = conversationRepository ?? new PrismaConversationRepository();
    }

    protected async implementation(data: ListMessagesDto): Promise<Message[]> {
        const conversation = await this.conversationRepository.findById(data.conversation_id);
        if (!conversation) {
            throw new ConversationNotFoundError(data.conversation_id);
        }
        
        if (conversation.participant_1_id !== data.requester_company_id && conversation.participant_2_id !== data.requester_company_id) {
            throw new ConversationAccessDeniedError(data.conversation_id);
        }

        await this.messageRepository.markAsRead(data.conversation_id, data.requester_company_id);
        await this.conversationRepository.resetUnreadCount(data.conversation_id, data.requester_company_id);

        const messages = await this.messageRepository.listByConversation(data.conversation_id, data.limit, data.offset);
        return messages;
    }
}
