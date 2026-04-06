import { PaymentCondition } from "../entities/paymentCondition.entity";

export interface PaymentConditionRepository {
    list(): Promise<PaymentCondition[]>;
}
