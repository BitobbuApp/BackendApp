import { UseCase } from "../../../shared/application/useCase";
import { RequestRepository } from "../domain/repositories/request.repository";
import { PrismaRequestRepository } from "../infrastructure/persistence/PrismaRequestRepository";
import { createRequestDtoRequestSchema, requestDtoResponseSchema } from "./dtos/request.dto";
import Joi from "joi";

interface CreateRequestDto {
    company_id: string;
    product_service: string;
    quantity: number;
    user_id?: string | null;
    unit_of_measure?: string;
    description?: string | null;
    category?: string | null;
    status?: string;
    expiration_date?: Date | null;
    files?: Array<{ url: string; file_name?: string | null }>;
}

interface RequestFileResult {
    id: string;
    request_id: string;
    url: string;
    file_name: string | null;
    created_at: Date | null;
}

interface RequestResult {
    id: string;
    company_id: string;
    user_id: string | null;
    product_service: string;
    quantity: number;
    unit_of_measure: string;
    description: string | null;
    category: string | null;
    status: string;
    expiration_date: Date | null;
    response_count: number;
    files: RequestFileResult[];
    created_at: Date | null;
    updated_at: Date | null;
}

export class CreateRequestUseCase extends UseCase<CreateRequestDto, RequestResult> {
    protected inputSchema: Joi.Schema = createRequestDtoRequestSchema;
    protected outputSchema: Joi.Schema = requestDtoResponseSchema;
    private readonly requestRepository: RequestRepository;

    constructor() {
        super();
        this.requestRepository = new PrismaRequestRepository();
    }

    protected async implementation(data: CreateRequestDto): Promise<RequestResult> {
        const created = await this.requestRepository.create(data as any);
        return {
            id: created.id,
            company_id: created.company_id,
            user_id: created.user_id,
            product_service: created.product_service,
            quantity: created.quantity,
            unit_of_measure: created.unit_of_measure,
            description: created.description,
            category: created.category,
            status: created.status,
            expiration_date: created.expiration_date,
            response_count: created.response_count,
            files: created.files,
            created_at: created.created_at,
            updated_at: created.updated_at,
        };
    }
}
