import { UseCase } from "../../../shared/application/useCase";
import { DeliveryMethodRepository } from "../domain/repositories/deliveryMethod.repository";
import { PrismaDeliveryMethodRepository } from "../infrastructure/persistence/PrismaDeliveryMethodRepository";
import { adminListDeliveryMethodsInputSchema, listDeliveryMethodsAdminDtoResponseSchema } from "./dtos/adminDeliveryMethod.dto";

interface AdminListDeliveryMethodsInput {
    country_id?: number;
}

export class AdminListDeliveryMethodsUseCase extends UseCase<AdminListDeliveryMethodsInput, any> {
    protected inputSchema = adminListDeliveryMethodsInputSchema;
    protected outputSchema = listDeliveryMethodsAdminDtoResponseSchema;
    private readonly repository: DeliveryMethodRepository;

    constructor() {
        super();
        this.repository = new PrismaDeliveryMethodRepository();
    }

    protected async implementation(input: AdminListDeliveryMethodsInput): Promise<any> {
        return this.repository.list(input?.country_id);
    }
}
