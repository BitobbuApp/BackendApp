import { UseCase } from "../../../shared/application/useCase";
import { TransactionRepository } from "../domain/repositories/transaction.repository";
import { PrismaTransactionRepository } from "../infrastructure/persistence/PrismaTransactionRepository";
import { TransactionNotFoundError } from "../domain/errors/transaction.errors";
import { updateTransactionDtoRequestSchema, transactionDtoResponseSchema } from "./dtos/transaction.dto";
import Joi from "joi";

interface UpdateTransactionDto {
    id: string;
    product_description?: string;
    unit_price_usd?: number;
    quantity?: number;
    total_amount_usd?: number;
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

export class UpdateTransactionUseCase extends UseCase<UpdateTransactionDto, any> {
    protected inputSchema: Joi.Schema = updateTransactionDtoRequestSchema;
    protected outputSchema: Joi.Schema = transactionDtoResponseSchema;
    private readonly transactionRepository: TransactionRepository;

    constructor() {
        super();
        this.transactionRepository = new PrismaTransactionRepository();
    }

    protected async implementation(data: UpdateTransactionDto): Promise<any> {
        const { id, ...updateData } = data;

        // Verify existence
        const existing = await this.transactionRepository.findById(id);
        if (!existing) throw new TransactionNotFoundError(id);

        const updated = await this.transactionRepository.update(id, updateData);
        return updated;
    }
}
