import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { listPaymentMethodsDtoResponseSchema } from "./dtos/paymentMethod.dto";
import { PaymentMethodRepository } from "../domain/repositories/paymentMethod.repository";
import { PrismaPaymentMethodRepository } from "../infrastructure/persistence/PrismaPaymentMethodRepository";

export class ListPaymentMethodsUseCase extends UseCase<Record<string, never>, any> {
    protected inputSchema: Joi.Schema = Joi.object({});
    protected outputSchema: Joi.Schema = listPaymentMethodsDtoResponseSchema;
    private readonly paymentMethodRepository: PaymentMethodRepository;

    constructor() {
        super();
        this.paymentMethodRepository = new PrismaPaymentMethodRepository();
    }

    protected async implementation(): Promise<any> {
        return await this.paymentMethodRepository.list();
    }
}
