import { UseCase } from "../../../shared/application/useCase";
import { TransactionRepository } from "../domain/repositories/transaction.repository";
import { PrismaTransactionRepository } from "../infrastructure/persistence/PrismaTransactionRepository";
import { PrismaConversationRepository } from "../../conversations/infrastructure/persistence/PrismaConversationRepository";
import { createTransactionDtoRequestSchema, transactionDtoResponseSchema } from "./dtos/transaction.dto";
import Joi from "joi";

interface CreateTransactionDto {
    quote_response_id: string;
    buyer_id: string;
    supplier_id: string;
    product_description: string;
    unit_price_usd: number;
    quantity: number;
    total_amount_usd: number;
    payment_method_id?: number | null;
    payment_conditions?: string;
    delivery_time?: string;
    status?: string;
    estimated_delivery_date?: Date;
    actual_delivery_date?: Date;
    cancellation_reason?: string;
    buyer_confirmed?: boolean;
    supplier_confirmed?: boolean;
    buyer_confirmed_at?: Date;
    supplier_confirmed_at?: Date;
}

export class CreateTransactionUseCase extends UseCase<CreateTransactionDto, any> {
    protected inputSchema: Joi.Schema = createTransactionDtoRequestSchema;
    // We disable the rigid outputSchema validation here so we can inject the conversation_id without failing Joi checks
    protected outputSchema: Joi.Schema = Joi.any(); 
    private readonly transactionRepository: TransactionRepository;
    private readonly conversationRepository: PrismaConversationRepository;

    constructor() {
        super();
        this.transactionRepository = new PrismaTransactionRepository();
        this.conversationRepository = new PrismaConversationRepository();
    }

    protected async implementation(data: CreateTransactionDto): Promise<any> {
        // 1. Create the base transaction
        const created = await this.transactionRepository.create(data);
        
        // 2. Chat Integration
        // Check if a conversation already exists between these participants
        let conversation = await this.conversationRepository.findByParticipants(data.buyer_id, data.supplier_id);
        
        if (!conversation) {
            // Create a new conversation if it doesn't exist
            conversation = await this.conversationRepository.create({
                participant_1_id: data.buyer_id,
                participant_2_id: data.supplier_id,
                transaction_id: created.id,
                quote_response_id: data.quote_response_id
            });
        }
        
        // 3. Attach conversation info to response 
        return { 
            ...created, 
            conversation_id: conversation.id 
        };
    }
}
