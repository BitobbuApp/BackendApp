import { UseCase } from "../../../shared/application/useCase";
import { RequestRepository } from "../domain/repositories/request.repository";
import { PrismaRequestRepository } from "../infrastructure/persistence/PrismaRequestRepository";
import { RequestNotFoundError } from "../domain/errors/request.errors";
import { updateRequestDtoRequestSchema, requestDtoResponseSchema } from "./dtos/request.dto";
import Joi from "joi";
import { SubcategoryRepository } from "../../subcategories/domain/repositories/subcategory.repository";
import { PrismaSubcategoryRepository } from "../../subcategories/infrastructure/persistence/PrismaSubcategoryRepository";
import { resolveCategoryAndSubcategory } from "../../subcategories/application/helpers/resolveSubcategory";

interface UpdateRequestDto {
    id: string;
    product_service?: string;
    quantity?: number;
    user_id?: string | null;
    unit_id?: number;
    description?: string | null;
    category_id?: number | null;
    subcategory_id?: number | null | '';
    status?: string;
    expiration_date?: Date | null;
    payment_condition_id?: string | null;
    country_id?: number | null;
    state_id?: number | null;
}

export class UpdateRequestUseCase extends UseCase<UpdateRequestDto, any> {
    protected inputSchema: Joi.Schema = updateRequestDtoRequestSchema;
    protected outputSchema: Joi.Schema = requestDtoResponseSchema;
    private readonly requestRepository: RequestRepository;
    private readonly subcategoryRepository: SubcategoryRepository;

    constructor() {
        super();
        this.requestRepository = new PrismaRequestRepository();
        this.subcategoryRepository = new PrismaSubcategoryRepository();
    }

    protected async implementation(data: UpdateRequestDto): Promise<any> {
        const { id, ...updateData } = data;

        const existingRequest = await this.requestRepository.findById(id);
        if (!existingRequest) throw new RequestNotFoundError(id);

        // Optional subcategory: validated against the category; changing the category clears a mismatching one
        Object.assign(updateData, await resolveCategoryAndSubcategory(this.subcategoryRepository, updateData, {
            category_id: existingRequest.category_id,
            subcategory_id: existingRequest.subcategory_id,
        }));

        const updated = await this.requestRepository.update(id, updateData as any);
        return {
            id: updated.id,
            company_id: updated.company_id,
            user_id: updated.user_id,
            unit_id: (updated as any).unit_id,
            product_service: updated.product_service,
            quantity: updated.quantity,
            unit_of_measure: updated.unit_of_measure,
            description: updated.description,
            category: updated.category,
            category_id: (updated as any).category_id ?? null,
            subcategory_id: updated.subcategory_id,
            subcategory: updated.subcategory,
            status: updated.status,
            type: (updated as any).type,
            payment_condition_id: updated.payment_condition_id,
            country_id: updated.country_id,
            state_id: updated.state_id,
            expiration_date: updated.expiration_date,
            response_count: updated.response_count,
            files: updated.files,
            created_at: updated.created_at,
            updated_at: updated.updated_at,
        };
    }
}
