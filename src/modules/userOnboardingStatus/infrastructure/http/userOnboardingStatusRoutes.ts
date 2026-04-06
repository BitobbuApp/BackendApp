import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../../../shared/infrastructure/http/middlewares/authMiddleware";
import { ApiResponse } from "../../../../shared/infrastructure/http/responseFormatter";
import { GetOnboardingStatusUseCase } from "../../application/getOnboardingStatusUseCase";
import { CompleteOnboardingUseCase } from "../../application/completeOnboardingUseCase";

export async function userOnboardingStatusRoutes(app: FastifyInstance) {
    // GET /onboarding-status
    // Returns all module tutorial statuses for the authenticated user+company
    app.get(
        "/",
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new GetOnboardingStatusUseCase();
            const result = await useCase.execute({
                user_id: request.user.userId,
                company_id: request.user.companyId,
            });
            return ApiResponse.success(reply, result, "Onboarding status listed");
        },
    );

    // POST /onboarding-status/complete
    // Marks a specific module tutorial as completed (idempotent)
    app.post(
        "/complete",
        { preHandler: [authMiddleware] } as any,
        async (request: any, reply: any) => {
            const useCase = new CompleteOnboardingUseCase();
            const result = await useCase.execute({
                ...request.body,
                user_id: request.user.userId,
                company_id: request.user.companyId,
            });
            return ApiResponse.success(reply, result, "Tutorial marked as completed");
        },
    );
}
