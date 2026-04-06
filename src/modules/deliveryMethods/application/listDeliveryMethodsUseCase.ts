import { UseCase } from "../../../shared/application/useCase";
import { DeliveryMethodRepository } from "../domain/repositories/deliveryMethod.repository";
import { PrismaDeliveryMethodRepository } from "../infrastructure/persistence/PrismaDeliveryMethodRepository";
import { deliveryMethodListResponseSchema } from "./dtos/deliveryMethod.dto";
import Joi from "joi";

export class ListDeliveryMethodsUseCase extends UseCase<number, any> {
    protected inputSchema: Joi.Schema = Joi.number().integer().min(1).required();
    protected outputSchema: Joi.Schema = deliveryMethodListResponseSchema;
    private readonly repository: DeliveryMethodRepository;

    constructor() {
        super();
        this.repository = new PrismaDeliveryMethodRepository();
    }

    protected async implementation(countryId: number): Promise<any> {
        return await this.repository.findByCountryId(countryId);
    }
}
