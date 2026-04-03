import { FastifyInstance } from "fastify";
import { authMiddleware } from '../../../../shared/infrastructure/http/middlewares/authMiddleware';
import { ApiResponse } from "../../../../shared/infrastructure/http/responseFormatter";
import { ListAppMetaDataUseCase } from "../../application/listAppMetaDataUseCase";

export async function metaDataRoutes(app: FastifyInstance) {
    app.get("/app", async (_request: any, reply: any) => {
        const useCase = new ListAppMetaDataUseCase();
        const result = await useCase.execute({});
        return ApiResponse.success(reply, result, "App metadata listed");
    });
}
