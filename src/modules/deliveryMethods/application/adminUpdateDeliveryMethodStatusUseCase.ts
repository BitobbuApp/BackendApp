import { UseCase } from "../../../shared/application/useCase";
import { DeliveryMethodRepository } from "../domain/repositories/deliveryMethod.repository";
import { PrismaDeliveryMethodRepository } from "../infrastructure/persistence/PrismaDeliveryMethodRepository";
import { adminUpdateDeliveryMethodStatusInputSchema, deliveryMethodAdminDtoResponseSchema } from "./dtos/adminDeliveryMethod.dto";

interface AdminUpdateDeliveryMethodStatusInput {
    id: string;
    is_active: boolean;
}

export class AdminUpdateDeliveryMethodStatusUseCase extends UseCase<AdminUpdateDeliveryMethodStatusInput, any> {
    protected inputSchema = adminUpdateDeliveryMethodStatusInputSchema;
    protected outputSchema = deliveryMethodAdminDtoResponseSchema;
    private readonly repository: DeliveryMethodRepository;

    constructor() {
        super();
        this.repository = new PrismaDeliveryMethodRepository();
    }

    protected async implementation(input: AdminUpdateDeliveryMethodStatusInput): Promise<any> {
        return this.repository.updateStatus(input.id, input.is_active);
    }
}
