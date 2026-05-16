import { ApplicationError } from "../../../shared/domain/error";
import { UseCase } from "../../../shared/application/useCase";
import { DeliveryMethodRepository } from "../domain/repositories/deliveryMethod.repository";
import { PrismaDeliveryMethodRepository } from "../infrastructure/persistence/PrismaDeliveryMethodRepository";
import { adminUpsertDeliveryMethodInputSchema, deliveryMethodAdminDtoResponseSchema } from "./dtos/adminDeliveryMethod.dto";

interface AdminUpsertDeliveryMethodInput {
    id?: string;
    data: {
        country_id: number;
        name: string;
        is_active?: boolean;
    };
}

export class AdminUpsertDeliveryMethodUseCase extends UseCase<AdminUpsertDeliveryMethodInput, any> {
    protected inputSchema = adminUpsertDeliveryMethodInputSchema;
    protected outputSchema = deliveryMethodAdminDtoResponseSchema;
    private readonly repository: DeliveryMethodRepository;

    constructor() {
        super();
        this.repository = new PrismaDeliveryMethodRepository();
    }

    protected async implementation(input: AdminUpsertDeliveryMethodInput): Promise<any> {
        if (input.id) {
            const existing = await this.repository.findById(input.id);
            if (!existing) {
                throw new ApplicationError(404, "Delivery method not found");
            }
            return this.repository.update(input.id, input.data);
        }

        return this.repository.create(input.data);
    }
}
