import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { ApiResponse } from "../../../../shared/infrastructure/http/responseFormatter";
import { ListStatesByCountryUseCase } from "../../application/listStatesByCountryUseCase";

interface ListStatesByCountryParams {
    countryId: string;
}

export async function stateRoutes(app: FastifyInstance) {
    app.get("/:countryId", async (request: FastifyRequest<{ Params: ListStatesByCountryParams }>, reply: FastifyReply) => {
        const useCase = new ListStatesByCountryUseCase();
        const result = await useCase.execute({
            country_id: Number(request.params.countryId),
        });

        return ApiResponse.success(reply, result, "States listed successfully");
    });
}
