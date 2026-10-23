import { UseCase } from "../../../shared/application/useCase";
import { SubcategoryRepository, UpdateSubcategoryData } from "../domain/repositories/subcategory.repository";
import { PrismaSubcategoryRepository } from "../infrastructure/persistence/PrismaSubcategoryRepository";
import { SubcategoryNotFoundError } from "../domain/errors/subcategory.errors";
import { adminSubcategoryDtoResponseSchema, adminUpdateSubcategoryInputSchema } from "./dtos/subcategory.dto";

interface AdminUpdateSubcategoryInput {
    id: number;
    data: UpdateSubcategoryData;
}

/** Only names and order can change: category_id and slug are immutable (rejected by the input schema). */
export class AdminUpdateSubcategoryUseCase extends UseCase<AdminUpdateSubcategoryInput, any> {
    protected inputSchema = adminUpdateSubcategoryInputSchema;
    protected outputSchema = adminSubcategoryDtoResponseSchema;
    private readonly subcategoryRepository: SubcategoryRepository;

    constructor() {
        super();
        this.subcategoryRepository = new PrismaSubcategoryRepository();
    }

    protected async implementation(input: AdminUpdateSubcategoryInput): Promise<any> {
        const existing = await this.subcategoryRepository.findById(input.id);
        if (!existing) throw new SubcategoryNotFoundError(input.id);

        return this.subcategoryRepository.update(input.id, input.data);
    }
}
