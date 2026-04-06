import { UserOnboardingStatus } from "../entities/userOnboardingStatus.entity";

export interface UserOnboardingStatusRepository {
    findByUserAndCompany(userId: string, companyId: string): Promise<UserOnboardingStatus[]>;
    upsertModule(userId: string, companyId: string, moduleName: string): Promise<UserOnboardingStatus>;
}
