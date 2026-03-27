import { IConversationRepository } from '../domain/repositories/conversation.repository.interface';
import { Conversation } from '../domain/entities/conversation.entity';
import { UseCase } from '../../../shared/application/useCase';
import Joi from 'joi';

interface ListUserConversationsDto {
    userId: string;
}

export class ListUserConversationsUseCase extends UseCase<ListUserConversationsDto, Conversation[]> {
    protected inputSchema: Joi.Schema = Joi.object({
        userId: Joi.string().uuid().required()
    });
    // We return array of conversations, disabling strict output schema for now
    protected outputSchema: Joi.Schema = Joi.any();

    constructor(private readonly conversationRepository: IConversationRepository) {
        super();
    }

    protected async implementation(data: ListUserConversationsDto): Promise<Conversation[]> {
        const conversations = await this.conversationRepository.listByUser(data.userId);
        return conversations;
    }
}
