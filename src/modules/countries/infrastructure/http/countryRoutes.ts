import { FastifyInstance, FastifyReply } from "fastify";
import { ApiResponse } from "../../../../shared/infrastructure/http/responseFormatter";
import { ListCountriesUseCase } from "../../application/listCountriesUseCase";

export async function countryRoutes(app: FastifyInstance) {
    app.get("/", async (_request: any, reply: FastifyReply) => {
        const useCase = new ListCountriesUseCase();
        const result = await useCase.execute({});

        return ApiResponse.success(reply, result, "Countries listed successfully");
    });
}
