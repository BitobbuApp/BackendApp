import { Category } from "../entities/category.entity";

export interface CategoryRepository {
    list(): Promise<Category[]>;
}
