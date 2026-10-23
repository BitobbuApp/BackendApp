import { UseCase } from "../../../shared/application/useCase";
import { SubcategoryRepository } from "../domain/repositories/subcategory.repository";
import { PrismaSubcategoryRepository } from "../infrastructure/persistence/PrismaSubcategoryRepository";
import { SubcategoryCategoryNotFoundError } from "../domain/errors/subcategory.errors";
import { adminCreateSubcategoryInputSchema, adminSubcategoryDtoResponseSchema } from "./dtos/subcategory.dto";
import { buildSubcategorySlug } from "./helpers/slugify";

interface AdminCreateSubcategoryInput {
    category_id: number;
    name_es: string;
    name_en?: string | null;
    slug?: string;
    sort_order: number;
}

export class AdminCreateSubcategoryUseCase extends UseCase<AdminCreateSubcategoryInput, any> {
    protected inputSchema = adminCreateSubcategoryInputSchema;
    protected outputSchema = adminSubcategoryDtoResponseSchema;
    private readonly subcategoryRepository: SubcategoryRepository;

    constructor() {
        super();
        this.subcategoryRepository = new PrismaSubcategoryRepository();
    }

    protected async implementation(input: AdminCreateSubcategoryInput): Promise<any> {
        const category = await this.subcategoryRepository.findCategory(input.category_id);
        if (!category) throw new SubcategoryCategoryNotFoundError(input.category_id);

        const created = await this.subcategoryRepository.create({
            category_id: category.id,
            slug: input.slug || buildSubcategorySlug(category.slug, input.name_es),
            name_es: input.name_es,
            name_en: input.name_en || input.name_es,
            sort_order: input.sort_order,
        });
        return { ...created, company_count: 0 };
    }
}
