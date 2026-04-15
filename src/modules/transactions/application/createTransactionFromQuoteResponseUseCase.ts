import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { PrismaTransactionRepository } from '../infrastructure/persistence/PrismaTransactionRepository';

interface CreateTransactionFromQuoteResponseDto {
    quote_response_id: string;
    buyer_id: string;
    supplier_id: string;
    product_description: string;
    unit_price_usd: number;
    quantity: number;
    total_amount_usd: number;
    payment_conditions?: string;
    payment_condition_id?: string | null;
    delivery_time?: string;
    exchange_rate_id?: string | null;
    payment_currency?: string;
}

const inputSchema = Joi.object({
    quote_response_id: Joi.string().uuid().required(),
    buyer_id: Joi.string().uuid().required(),
    supplier_id: Joi.string().uuid().required(),
    product_description: Joi.string().required(),
    unit_price_usd: Joi.number().required(),
    quantity: Joi.number().required(),
    total_amount_usd: Joi.number().required(),
    payment_conditions: Joi.string().allow(null, '').optional(),
    payment_condition_id: Joi.string().uuid().allow(null).optional(),
    delivery_time: Joi.string().allow(null, '').optional(),
    exchange_rate_id: Joi.string().allow(null, '').optional(),
    payment_currency: Joi.string().allow(null, '').optional(),
}).options({ stripUnknown: true });

const outputSchema = Joi.any();

export class CreateTransactionFromQuoteResponseUseCase extends UseCase<CreateTransactionFromQuoteResponseDto, any> {
    protected inputSchema = inputSchema;
    protected outputSchema = outputSchema;

    private readonly transactionRepo = new PrismaTransactionRepository();

    protected async implementation(data: CreateTransactionFromQuoteResponseDto): Promise<any> {
        const transaction = await this.transactionRepo.createFromQuoteResponse(data);
        return transaction;
    }
}
