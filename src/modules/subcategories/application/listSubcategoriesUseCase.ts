import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { SubcategoryRepository } from "../domain/repositories/subcategory.repository";
import { PrismaSubcategoryRepository } from "../infrastructure/persistence/PrismaSubcategoryRepository";
import { listSubcategoriesDtoResponseSchema } from "./dtos/subcategory.dto";

/** Active subcategories of active categories, for the public app metadata. */
export class ListSubcategoriesUseCase extends UseCase<Record<string, never>, any> {
    protected inputSchema: Joi.Schema = Joi.object({});
    protected outputSchema: Joi.Schema = listSubcategoriesDtoResponseSchema;
    private readonly subcategoryRepository: SubcategoryRepository;

    constructor() {
        super();
        this.subcategoryRepository = new PrismaSubcategoryRepository();
    }

    protected async implementation(): Promise<any> {
        return this.subcategoryRepository.listActive();
    }
}
