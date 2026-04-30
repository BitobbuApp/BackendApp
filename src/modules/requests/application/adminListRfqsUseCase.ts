import { UseCase } from "../../../shared/application/useCase";
import { RequestRepository } from "../domain/repositories/request.repository";
import { PrismaRequestRepository } from "../infrastructure/persistence/PrismaRequestRepository";
import Joi from "joi";

export class AdminListRfqsUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        search: Joi.string().allow('').optional(),
        status: Joi.string().allow('').optional(),
        company_id: Joi.string().uuid().optional(),
        category_id: Joi.number().integer().optional()
    });
    protected outputSchema = Joi.any();

    private readonly requestRepository: RequestRepository;

    constructor(requestRepository?: RequestRepository) {
        super();
        this.requestRepository = requestRepository || new PrismaRequestRepository();
    }

    protected async implementation(input: any): Promise<any> {
        const { page, limit, ...filters } = input;
        const result = await this.requestRepository.findAllAdmin(filters, page, limit);

        return {
            items: result.data.map(item => ({
                id: item.id,
                product_service: item.product_service,
                quantity: item.quantity,
                unit: item.unit_of_measure,
                status: item.status,
                created_at: item.created_at,
                expiration_date: item.expiration_date,
                response_count: (item as any)._raw?._count?.quote_responses ?? 0,
                company: item.company ? {
                    id: item.company.id,
                    trade_name: item.company.trade_name
                } : null,
                category: item.category
            })),
            total: result.total,
            page: result.page,
            limit: result.limit,
            total_pages: Math.ceil(result.total / result.limit)
        };
    }
}
