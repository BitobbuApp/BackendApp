import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { listCategoriesDtoResponseSchema } from "./dtos/category.dto";
import { CategoryRepository } from "../domain/repositories/category.repository";
import { PrismaCategoryRepository } from "../infrastructure/persistence/PrismaCategoryRepository";

export class ListCategoriesUseCase extends UseCase<Record<string, never>, any> {
    protected inputSchema: Joi.Schema = Joi.object({});
    protected outputSchema: Joi.Schema = listCategoriesDtoResponseSchema;
    private readonly categoryRepository: CategoryRepository;

    constructor() {
        super();
        this.categoryRepository = new PrismaCategoryRepository();
    }

    protected async implementation(): Promise<any> {
        return await this.categoryRepository.list();
    }
}
