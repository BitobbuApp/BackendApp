import { UseCase } from "../../../shared/application/useCase";
import { RequestRepository } from "../domain/repositories/request.repository";
import { PrismaRequestRepository } from "../infrastructure/persistence/PrismaRequestRepository";
import { getRequestsByCompanyIdDtoRequestSchema, requestListDtoResponseSchema } from "./dtos/request.dto";
import Joi from "joi";

interface GetRequestsByCompanyIdDto {
    company_id: string;
    page: number;
    limit: number;
}

export class GetRequestsByCompanyIdUseCase extends UseCase<GetRequestsByCompanyIdDto, any> {
    protected inputSchema: Joi.Schema = getRequestsByCompanyIdDtoRequestSchema;
    protected outputSchema: Joi.Schema = requestListDtoResponseSchema;
    private readonly requestRepository: RequestRepository;

    constructor() {
        super();
        this.requestRepository = new PrismaRequestRepository();
    }

    protected async implementation(data: GetRequestsByCompanyIdDto): Promise<any> {
        const result = await this.requestRepository.findByCompanyId(data.company_id, data.page, data.limit);
        return {
            data: result.data.map(request => ({
                id: request.id,
                company_id: request.company_id,
                user_id: request.user_id,
                product_service: request.product_service,
                quantity: request.quantity,
                unit_id: request.unit_id,
                unit_of_measure: request.unit_of_measure,
                description: request.description,
                category_id: request.category_id,
                category: request.category,
                status: request.status,
                type: (request as any).type,
                expiration_date: request.expiration_date,
                response_count: request.response_count,
                files: request.files,
                created_at: request.created_at,
                updated_at: request.updated_at,
            })),
            total: result.total,
            page: result.page,
            limit: result.limit
        };
    }
}
