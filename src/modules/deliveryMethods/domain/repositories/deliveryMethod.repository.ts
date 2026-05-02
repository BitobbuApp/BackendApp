import { DeliveryMethodEntity } from "../entities/deliveryMethod.entity";

export interface DeliveryMethodRepository {
    list(countryId?: number): Promise<DeliveryMethodEntity[]>;
    findByCountryId(countryId: number): Promise<DeliveryMethodEntity[]>;
    findById(id: string): Promise<DeliveryMethodEntity | null>;
    create(data: Partial<DeliveryMethodEntity>): Promise<DeliveryMethodEntity>;
    update(id: string, data: Partial<DeliveryMethodEntity>): Promise<DeliveryMethodEntity>;
    updateStatus(id: string, isActive: boolean): Promise<DeliveryMethodEntity>;
}
