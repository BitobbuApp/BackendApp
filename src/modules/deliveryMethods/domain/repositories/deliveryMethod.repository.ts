import { DeliveryMethodEntity } from "../entities/deliveryMethod.entity";

export interface DeliveryMethodRepository {
    findByCountryId(countryId: number): Promise<DeliveryMethodEntity[]>;
}
