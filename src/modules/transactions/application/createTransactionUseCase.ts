import { UseCase } from "../../../shared/application/useCase";
import { TransactionRepository } from "../domain/repositories/transaction.repository";
import { PrismaTransactionRepository } from "../infrastructure/persistence/PrismaTransactionRepository";
import { createTransactionDtoRequestSchema, transactionDtoResponseSchema } from "./dtos/transaction.dto";
import Joi from "joi";

interface CreateTransactionDto {
    quote_response_id: string;
    buyer_id: string;
    supplier_id: string;
    product_description: string;
    unit_price: number;
    quantity: number;
    total_amount: number;
    payment_method?: string;
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
    protected outputSchema: Joi.Schema = transactionDtoResponseSchema;
    private readonly transactionRepository: TransactionRepository;

    constructor() {
        super();
        this.transactionRepository = new PrismaTransactionRepository();
    }

    protected async implementation(data: CreateTransactionDto): Promise<any> {
        const created = await this.transactionRepository.create(data);
        return created;
    }
}
