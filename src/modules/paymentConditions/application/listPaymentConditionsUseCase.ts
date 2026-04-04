import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { listPaymentConditionsDtoResponseSchema } from "./dtos/paymentCondition.dto";
import { PaymentConditionRepository } from "../domain/repositories/paymentCondition.repository";
import { PrismaPaymentConditionRepository } from "../infrastructure/persistence/PrismaPaymentConditionRepository";

export class ListPaymentConditionsUseCase extends UseCase<Record<string, never>, any> {
    protected inputSchema: Joi.Schema = Joi.object({});
    protected outputSchema: Joi.Schema = listPaymentConditionsDtoResponseSchema;
    private readonly paymentConditionRepository: PaymentConditionRepository;

    constructor() {
        super();
        this.paymentConditionRepository = new PrismaPaymentConditionRepository();
    }

    protected async implementation(): Promise<any> {
        return await this.paymentConditionRepository.list();
    }
}
