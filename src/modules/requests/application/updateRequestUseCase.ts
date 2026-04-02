import { UseCase } from "../../../shared/application/useCase";
import { RequestRepository } from "../domain/repositories/request.repository";
import { PrismaRequestRepository } from "../infrastructure/persistence/PrismaRequestRepository";
import { RequestNotFoundError } from "../domain/errors/request.errors";
import { updateRequestDtoRequestSchema, requestDtoResponseSchema } from "./dtos/request.dto";
import Joi from "joi";

interface UpdateRequestDto {
    id: string;
    product_service?: string;
    quantity?: number;
    user_id?: string | null;
    unit_id?: number;
    description?: string | null;
    category_id?: number | null;
    status?: string;
    expiration_date?: Date | null;
}

export class UpdateRequestUseCase extends UseCase<UpdateRequestDto, any> {
    protected inputSchema: Joi.Schema = updateRequestDtoRequestSchema;
    protected outputSchema: Joi.Schema = requestDtoResponseSchema;
    private readonly requestRepository: RequestRepository;

    constructor() {
        super();
        this.requestRepository = new PrismaRequestRepository();
    }

    protected async implementation(data: UpdateRequestDto): Promise<any> {
        const { id, ...updateData } = data;

        const existingRequest = await this.requestRepository.findById(id);
        if (!existingRequest) throw new RequestNotFoundError(id);

        const updated = await this.requestRepository.update(id, updateData);
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
            status: updated.status,
            expiration_date: updated.expiration_date,
            response_count: updated.response_count,
            files: updated.files,
            created_at: updated.created_at,
            updated_at: updated.updated_at,
        };
    }
}
