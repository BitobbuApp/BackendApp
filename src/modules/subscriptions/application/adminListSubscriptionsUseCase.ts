import { UseCase } from "../../../shared/application/useCase";
import { SubscriptionRepository } from "../domain/repositories/subscription.repository";
import { PrismaSubscriptionRepository } from "../infrastructure/persistence/PrismaSubscriptionRepository";
import Joi from "joi";

export class AdminListSubscriptionsUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
        status: Joi.string().valid('active', 'expired', 'inactive').optional(),
        company_id: Joi.string().uuid().optional()
    });
    protected outputSchema = Joi.any();

    private readonly subscriptionRepository: SubscriptionRepository;

    constructor(subscriptionRepository?: SubscriptionRepository) {
        super();
        this.subscriptionRepository = subscriptionRepository || new PrismaSubscriptionRepository();
    }

    protected async implementation(input: any): Promise<any> {
        const { page, limit, ...filters } = input;
        const result = await this.subscriptionRepository.findAllAdmin(filters, page, limit);

        return {
            items: result.items,
            total: result.total,
            page,
            limit,
            total_pages: Math.ceil(result.total / limit)
        };
    }
}
