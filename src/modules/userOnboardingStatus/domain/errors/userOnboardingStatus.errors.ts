import { ApplicationError } from "../../../../shared/domain/error";

export class OnboardingStatusNotFoundError extends ApplicationError {
    constructor(userId: string, moduleName: string) {
        super(404, `Onboarding status for user ${userId} and module "${moduleName}" not found`);
    }
}
