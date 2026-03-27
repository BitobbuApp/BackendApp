import { IMessageRepository } from '../domain/repositories/message.repository.interface';
import { IConversationRepository } from '../../conversations/domain/repositories/conversation.repository.interface';
import { Message } from '../domain/entities/message.entity';
import { UseCase } from '../../../shared/application/useCase';
import { createMessageDtoRequestSchema } from './dtos/message.dto';
import Joi from 'joi';

interface CreateMessageDto {
    conversation_id: string;
    sender_id: string;
    client_msg_id?: string | null;
    content?: string | null;
    file_url?: string | null;
    file_name?: string | null;
}

export class CreateMessageUseCase extends UseCase<CreateMessageDto, { message: Message, isDuplicate: boolean }> {
    protected inputSchema: Joi.Schema = createMessageDtoRequestSchema;
    // We return an object containing the message and isDuplicate flag
    protected outputSchema: Joi.Schema = Joi.any(); 

    constructor(
        private readonly messageRepository: IMessageRepository,
        private readonly conversationRepository: IConversationRepository
    ) {
        super();
    }

    protected async implementation(data: CreateMessageDto): Promise<{ message: Message, isDuplicate: boolean }> {
        // IDEMPOTENCY STRATEGY: 
        // If client_msg_id is provided, check if a message with this ID already exists.
        if (data.client_msg_id) {
            const existingMessage = await this.messageRepository.findByClientMsgId(data.client_msg_id);
            if (existingMessage) {
                // Return the existing one instead of failing or duplicating
                return { message: existingMessage, isDuplicate: true };
            }
        }

        // 1. Create the message
        const createdMessage = await this.messageRepository.create(data);

        // 2. Update the conversation's last message snippet and unread counts
        let snippet = data.content || '';
        if (data.file_url) snippet = snippet ? `${snippet} (Archivo)` : 'Archivo adjunto';

        // We update the conversation to track unread messages. 
        // The read logic (resetting to 0) will happen when the other user opens the chat.
        await this.conversationRepository.updateLastMessage(
            data.conversation_id,
            snippet,
            new Date(),
            data.sender_id // The sender is the one who caused the unread count to increase for the OTHER user
        );

        return { message: createdMessage, isDuplicate: false };
    }
}
