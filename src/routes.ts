import { FastifyInstance } from "fastify";
import { userRoutes } from "./modules/users/infrastructure/http/userRoutes";

export async function routes(app: FastifyInstance) {
    app.register(userRoutes, { prefix: '/users' });
}
