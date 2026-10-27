import { UseCase } from "../../../shared/application/useCase";
import { SubcategoryRepository } from "../domain/repositories/subcategory.repository";
import { PrismaSubcategoryRepository } from "../infrastructure/persistence/PrismaSubcategoryRepository";
import { SubcategoryNotFoundError } from "../domain/errors/subcategory.errors";
import { adminSubcategoryDtoResponseSchema, adminUpdateSubcategoryStatusInputSchema } from "./dtos/subcategory.dto";

interface AdminUpdateSubcategoryStatusInput {
    id: number;
    is_active: boolean;
}

/**
 * Activates / deactivates a subcategory. Companies keep their link while it is inactive
 * (it is just hidden), so reactivating it brings it back to their profiles.
 */
export class AdminUpdateSubcategoryStatusUseCase extends UseCase<AdminUpdateSubcategoryStatusInput, any> {
    protected inputSchema = adminUpdateSubcategoryStatusInputSchema;
    protected outputSchema = adminSubcategoryDtoResponseSchema;
    private readonly subcategoryRepository: SubcategoryRepository;

    constructor() {
        super();
        this.subcategoryRepository = new PrismaSubcategoryRepository();
    }

    protected async implementation(input: AdminUpdateSubcategoryStatusInput): Promise<any> {
        const existing = await this.subcategoryRepository.findById(input.id);
        if (!existing) throw new SubcategoryNotFoundError(input.id);

        return this.subcategoryRepository.updateStatus(input.id, input.is_active);
    }
}
