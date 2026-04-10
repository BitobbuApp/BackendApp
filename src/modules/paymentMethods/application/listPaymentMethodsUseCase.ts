import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { listPaymentMethodsDtoResponseSchema } from "./dtos/paymentMethod.dto";
import { PaymentMethodRepository } from "../domain/repositories/paymentMethod.repository";
import { PrismaPaymentMethodRepository } from "../infrastructure/persistence/PrismaPaymentMethodRepository";

interface ListPaymentMethodsInput {
    country_id?: number;
}

export class ListPaymentMethodsUseCase extends UseCase<ListPaymentMethodsInput, any> {
    protected inputSchema: Joi.Schema = Joi.object({
        country_id: Joi.number().integer().min(1).optional(),
    });
    protected outputSchema: Joi.Schema = listPaymentMethodsDtoResponseSchema;
    private readonly paymentMethodRepository: PaymentMethodRepository;

    constructor() {
        super();
        this.paymentMethodRepository = new PrismaPaymentMethodRepository();
    }

    protected async implementation(input: ListPaymentMethodsInput): Promise<any> {
        if (input.country_id) {
            return await this.paymentMethodRepository.listByCountry(input.country_id);
        }
        return await this.paymentMethodRepository.list();
    }
}
