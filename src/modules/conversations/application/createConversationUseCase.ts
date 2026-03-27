import { IConversationRepository } from '../domain/repositories/conversation.repository.interface';
import { Conversation } from '../domain/entities/conversation.entity';
import { UseCase } from '../../../shared/application/useCase';
import { createConversationDtoRequestSchema, conversationDtoResponseSchema } from './dtos/conversation.dto';
import Joi from 'joi';

interface CreateConversationDto {
    participant_1_id: string;
    participant_2_id: string;
    request_id?: string;
    quote_response_id?: string;
    transaction_id?: string;
}

export class CreateConversationUseCase extends UseCase<CreateConversationDto, Conversation> {
    protected inputSchema: Joi.Schema = createConversationDtoRequestSchema;
    protected outputSchema: Joi.Schema = conversationDtoResponseSchema;

    constructor(private readonly conversationRepository: IConversationRepository) {
        super();
    }

    protected async implementation(data: CreateConversationDto): Promise<Conversation> {
        // Find existing conversation between the two participants
        const existing = await this.conversationRepository.findByParticipants(data.participant_1_id, data.participant_2_id);

        if (existing) {
            // A conversation already exists. We return it without creating a new one.
            return existing;
        }

        return await this.conversationRepository.create(data);
    }
}
