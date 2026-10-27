import { IMessageRepository } from '../domain/repositories/message.repository.interface';
import { IConversationRepository } from '../../conversations/domain/repositories/conversation.repository.interface';
import { PrismaConversationRepository } from '../../conversations/infrastructure/persistence/PrismaConversationRepository';
import { PrismaMessageRepository } from '../infrastructure/persistence/PrismaMessageRepository';
import { Message } from '../domain/entities/message.entity';
import { UseCase } from '../../../shared/application/useCase';
import { createMessageDtoRequestSchema, createMessageUseCaseResponseSchema } from './dtos/message.dto';
import Joi from 'joi';
import { prisma } from '../../../shared/infrastructure/database';
import { ConversationAccessDeniedError, ConversationClosedError, ConversationNotFoundError } from '../../conversations/domain/errors/conversation.errors';

interface CreateMessageDto {
    conversation_id: string;
    sender_id: string;
    client_msg_id?: string | null;
    content?: string | null;
    file_url?: string | null;
    file_name?: string | null;
}

/** True when the company already submitted its review of the transaction */
const hasSubmittedReview = async (transactionId: string, companyId: string): Promise<boolean> => {
    const tx = await prisma.transaction.findUnique({
        where: { id: transactionId },
        select: { buyer_id: true, buyer_review_status: true, supplier_review_status: true },
    });
    if (!tx) return false;
    const status = tx.buyer_id === companyId ? tx.buyer_review_status : tx.supplier_review_status;
    return status === 'submitted';
};

export class CreateMessageUseCase extends UseCase<CreateMessageDto, { message: Message, isDuplicate: boolean }> {
    protected inputSchema: Joi.Schema = createMessageDtoRequestSchema;
    protected outputSchema: Joi.Schema = createMessageUseCaseResponseSchema;
    private readonly messageRepository: IMessageRepository;
    private readonly conversationRepository: IConversationRepository;
    private readonly hasReviewed: (transactionId: string, companyId: string) => Promise<boolean>;

    constructor(
        messageRepository?: IMessageRepository,
        conversationRepository?: IConversationRepository,
        hasReviewed?: (transactionId: string, companyId: string) => Promise<boolean>
    ) {
        super();
        this.messageRepository = messageRepository ?? new PrismaMessageRepository();
        this.conversationRepository = conversationRepository ?? new PrismaConversationRepository();
        this.hasReviewed = hasReviewed ?? hasSubmittedReview;
    }

    protected async implementation(data: CreateMessageDto): Promise<{ message: Message, isDuplicate: boolean }> {
        const conversation = await this.conversationRepository.findById(data.conversation_id);
        if (!conversation) {
            throw new ConversationNotFoundError(data.conversation_id);
        }

        if (conversation.participant_1_id !== data.sender_id && conversation.participant_2_id !== data.sender_id) {
            throw new ConversationAccessDeniedError(data.conversation_id);
        }

        // A closed negotiation (e.g. the buyer rejected the quote) stays visible but read-only
        if (conversation.status === 'cancelled') {
            throw new ConversationClosedError(data.conversation_id);
        }

        // Whoever already submitted their review is done with this chat: history only while the other side reviews
        if (conversation.status === 'pending_review' && conversation.transaction_id
            && await this.hasReviewed(conversation.transaction_id, data.sender_id)) {
            throw new ConversationClosedError(data.conversation_id);
        }

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
