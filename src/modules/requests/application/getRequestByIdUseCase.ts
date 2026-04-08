import { UseCase } from "../../../shared/application/useCase";
import { RequestRepository } from "../domain/repositories/request.repository";
import { PrismaRequestRepository } from "../infrastructure/persistence/PrismaRequestRepository";
import { RequestNotFoundError } from "../domain/errors/request.errors";
import { requestDtoResponseSchema } from "./dtos/request.dto";
import Joi from "joi";

export class GetRequestByIdUseCase extends UseCase<string, any> {
    protected inputSchema: Joi.Schema = Joi.string().uuid().required();
    protected outputSchema: Joi.Schema = requestDtoResponseSchema;
    private readonly requestRepository: RequestRepository;

    constructor() {
        super();
        this.requestRepository = new PrismaRequestRepository();
    }

    protected async implementation(id: string): Promise<any> {
        const request = await this.requestRepository.findById(id);
        if (!request) throw new RequestNotFoundError(id);
        return {
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
            payment_condition_id: request.payment_condition_id,
            files: request.files,
            country_id: request.country_id,
            state_id: request.state_id,
            city_id: request.city_id,
            reach_service: request.reach_service,
            company: request.company ? {
                id: request.company.id,
                trade_name: request.company.trade_name,
                logo_url: request.company.logo_url,
                average_rating: request.company.average_rating,
                bio: request.company.bio,
                sector: request.company.sector,
                company_type: request.company.company_type,
                review_count: request.company.review_count,
                locations: request.company.locations,
            } : null,
            created_at: request.created_at,
            updated_at: request.updated_at,
        };
    }
}
