import { PaymentMethod } from "../entities/paymentMethod.entity";

export interface PaymentMethodRepository {
    list(): Promise<PaymentMethod[]>;
}
