import Joi from "joi";
import { UseCase } from "../../../shared/application/useCase";
import { RequestRepository } from "../domain/repositories/request.repository";
import { PrismaRequestRepository } from "../infrastructure/persistence/PrismaRequestRepository";
import { createRequestDtoRequestSchema, requestDtoResponseSchema } from "./dtos/request.dto";
import { RFQ_TYPE } from "../../../shared/constants/request/request.contants";

interface CreateRequestDto {
    company_id: string;
    product_service: string;
    quantity: number;
    user_id?: string | null;
    unit_id?: number;
    description?: string | null;
    category_id?: number | null;
    status?: string;
    type: number;
    payment_condition_id?: string | null;
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    reach_service?: string | null;
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
    unit_id: number;
    product_service: string;
    quantity: number;
    unit_of_measure: string;
    description: string | null;
    category: string | null;
    category_id: number | null;
    status: string;
    type: string;
    payment_condition_id?: string | null;
    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    reach_service?: string | null;
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
        (data as any).type = RFQ_TYPE[data.type as keyof typeof RFQ_TYPE] || 'product';   
        const created = await this.requestRepository.create(data as any);
        return {
            id: created.id,
            company_id: created.company_id,
            user_id: created.user_id,
            unit_id: (created as any).unit_id,
            product_service: created.product_service,
            quantity: created.quantity,
            unit_of_measure: created.unit_of_measure,
            description: created.description,
            category: created.category,
            category_id: (created as any).category_id ?? null,
            status: created.status,
            type: (created as any).type,
            payment_condition_id: created.payment_condition_id,
            country_id: created.country_id,
            state_id: created.state_id,
            city_id: created.city_id,
            reach_service: created.reach_service,
            expiration_date: created.expiration_date,
            response_count: created.response_count,
            files: created.files,
            created_at: created.created_at,
            updated_at: created.updated_at,
        };
    }
}
