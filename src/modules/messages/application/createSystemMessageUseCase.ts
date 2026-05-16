import { IMessageRepository } from '../domain/repositories/message.repository.interface';
import { IConversationRepository } from '../../conversations/domain/repositories/conversation.repository.interface';
import { PrismaConversationRepository } from '../../conversations/infrastructure/persistence/PrismaConversationRepository';
import { PrismaMessageRepository } from '../infrastructure/persistence/PrismaMessageRepository';
import { UseCase } from '../../../shared/application/useCase';
import Joi from 'joi';
import { ConversationNotFoundError } from '../../conversations/domain/errors/conversation.errors';
import { getIO } from '../../../shared/infrastructure/socket';
import logger from '../../../shared/infrastructure/logger';

interface CreateSystemMessageInput {
    conversationId: string;
    eventKey: string;
    eventPayload?: any;
    fileUrl?: string;
    fileName?: string;
}

export class CreateSystemMessageUseCase extends UseCase<CreateSystemMessageInput, void> {
    protected inputSchema: Joi.Schema = Joi.object({
        conversationId: Joi.string().uuid().required(),
        eventKey: Joi.string().max(60).required(),
        eventPayload: Joi.any().optional(),
        fileUrl: Joi.string().uri().optional(),
        fileName: Joi.string().max(255).optional(),
    }).options({ stripUnknown: true });

    protected outputSchema: Joi.Schema = Joi.any();
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

    protected async implementation(data: CreateSystemMessageInput): Promise<void> {
        const conversation = await this.conversationRepository.findById(data.conversationId);
        if (!conversation) {
            throw new ConversationNotFoundError(data.conversationId);
        }

        // 1. Create the system message in the database
        const createdMessage = await this.messageRepository.create({
            conversation_id: data.conversationId,
            sender_id: null,
            message_type: 'system',
            event_key: data.eventKey,
            event_payload: data.eventPayload ?? null,
            content: null,
            file_url: data.fileUrl ?? null,
            file_name: data.fileName ?? null,
        });


        // 2. Broadcast immediately using the real-time Socket.IO instance
        try {
            const io = getIO();
            io.to(data.conversationId).emit('receive_message', createdMessage);
        } catch (error) {
            logger.warn(`Could not emit system message for conversation ${data.conversationId}: ${error}`);
        }
    }
}
