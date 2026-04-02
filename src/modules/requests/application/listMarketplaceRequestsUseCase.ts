import { UseCase } from "../../../shared/application/useCase";
import { RequestRepository } from "../domain/repositories/request.repository";
import { PrismaRequestRepository } from "../infrastructure/persistence/PrismaRequestRepository";
import { marketplaceRequestListDtoResponseSchema } from "./dtos/request.dto";
import Joi from "joi";

interface ListMarketplaceRequestsInput {
    exclude_company_id: string;
    page: number;
    limit: number;
}

export class ListMarketplaceRequestsUseCase extends UseCase<ListMarketplaceRequestsInput, any> {
    protected inputSchema: Joi.Schema = Joi.object({
        exclude_company_id: Joi.string().uuid().required(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
    });
    protected outputSchema: Joi.Schema = marketplaceRequestListDtoResponseSchema;
    private readonly requestRepository: RequestRepository;

    constructor() {
        super();
        this.requestRepository = new PrismaRequestRepository();
    }

    protected async implementation(input: ListMarketplaceRequestsInput): Promise<any> {
        const result = await this.requestRepository.findExcludingCompany(
            input.exclude_company_id,
            input.page,
            input.limit
        );

        return {
            data: (result._raw || []).map((r: any) => ({
                id: r.id,
                company_id: r.company_id,
                user_id: r.user_id,
                product_service: r.product_service,
                quantity: Number(r.quantity),
                unit_id: r.unit_id,
                unit_of_measure: r.unit_of_measure?.name ?? '',
                description: r.description,
                category_id: r.category_id,
                category: r.category?.name_es ?? null,
                status: r.status,
                expiration_date: r.expiration_date,
                response_count: r.response_count,
                files: (r.files || []).map((f: any) => ({
                    id: f.id,
                    request_id: f.request_id,
                    url: f.url,
                    file_name: f.file_name,
                    created_at: f.created_at,
                })),
                company: r.company ? {
                    id: r.company.id,
                    trade_name: r.company.trade_name,
                    logo_url: r.company.logo_url,
                    sector: r.company.sector_ref?.name_es ?? null,
                    average_rating: r.company.average_rating ? Number(r.company.average_rating) : 0,
                } : null,
                created_at: r.created_at,
                updated_at: r.updated_at,
            })),
            total: result.total,
            page: result.page,
            limit: result.limit
        };
    }
}
