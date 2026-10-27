import { UseCase } from "../../../shared/application/useCase";
import { SubcategoryRepository } from "../domain/repositories/subcategory.repository";
import { PrismaSubcategoryRepository } from "../infrastructure/persistence/PrismaSubcategoryRepository";
import { adminListSubcategoriesDtoResponseSchema, adminListSubcategoriesInputSchema } from "./dtos/subcategory.dto";

interface AdminListSubcategoriesInput {
    category_id?: number;
}

export class AdminListSubcategoriesUseCase extends UseCase<AdminListSubcategoriesInput, any> {
    protected inputSchema = adminListSubcategoriesInputSchema;
    protected outputSchema = adminListSubcategoriesDtoResponseSchema;
    private readonly subcategoryRepository: SubcategoryRepository;

    constructor() {
        super();
        this.subcategoryRepository = new PrismaSubcategoryRepository();
    }

    protected async implementation(input: AdminListSubcategoriesInput): Promise<any> {
        return this.subcategoryRepository.listAdmin(input?.category_id);
    }
}
