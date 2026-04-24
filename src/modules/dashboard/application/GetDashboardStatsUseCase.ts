import { DashboardRepository } from "../domain/repositories/dashboard.repository";
import { UseCase } from "../../../shared/application/useCase";
import { getDashboardStatsDtoRequestSchema, getDashboardStatsDtoResponseSchema } from "./dtos/dashboardStats.dto";
import { PrismaDashboardRepository } from "../infrastructure/persistence/PrismaDashboardRepository";
import Joi from 'joi';

interface GetDashboardStatsInput {
    company_id: string;
}

export class GetDashboardStatsUseCase extends UseCase<GetDashboardStatsInput, any> {
    protected inputSchema: Joi.Schema = getDashboardStatsDtoRequestSchema;
    protected outputSchema: Joi.Schema = getDashboardStatsDtoResponseSchema;
    private readonly dashboardRepository: DashboardRepository;

    constructor() {
        super();
        this.dashboardRepository = new PrismaDashboardRepository();
    }

    protected async implementation(input: GetDashboardStatsInput): Promise<any> {
        return await this.dashboardRepository.getStats(input.company_id);
    }
}
