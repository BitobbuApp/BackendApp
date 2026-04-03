import { IConversationRepository } from '../domain/repositories/conversation.repository.interface';
import { PrismaConversationRepository } from '../infrastructure/persistence/PrismaConversationRepository';
import { Conversation } from '../domain/entities/conversation.entity';
import { UseCase } from '../../../shared/application/useCase';
import Joi from 'joi';
import { conversationListDtoResponseSchema, listConversationsQuerySchema } from './dtos/conversation.dto';

interface ListUserConversationsDto {
    company_id: string;
}

export class ListUserConversationsUseCase extends UseCase<ListUserConversationsDto, Conversation[]> {
    protected inputSchema: Joi.Schema = listConversationsQuerySchema;
    protected outputSchema: Joi.Schema = conversationListDtoResponseSchema;
    private readonly conversationRepository: IConversationRepository;

    constructor(conversationRepository?: IConversationRepository) {
        super();
        this.conversationRepository = conversationRepository ?? new PrismaConversationRepository();
    }

    protected async implementation(data: ListUserConversationsDto): Promise<Conversation[]> {
        const conversations = await this.conversationRepository.listByUser(data.company_id);
        return conversations;
    }
}
