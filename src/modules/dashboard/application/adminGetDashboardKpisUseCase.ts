import { UseCase } from "../../../shared/application/useCase";
import { DashboardRepository } from "../domain/repositories/dashboard.repository";
import { PrismaDashboardRepository } from "../infrastructure/persistence/PrismaDashboardRepository";
import Joi from "joi";

export class AdminGetDashboardKpisUseCase extends UseCase<void, any> {
    protected inputSchema = Joi.any();
    protected outputSchema = Joi.any();

    private readonly dashboardRepository: DashboardRepository;

    constructor(dashboardRepository?: DashboardRepository) {
        super();
        this.dashboardRepository = dashboardRepository || new PrismaDashboardRepository();
    }

    protected async implementation(): Promise<any> {
        return await this.dashboardRepository.getAdminKpis();
    }
}
