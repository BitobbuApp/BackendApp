import { FastifyInstance } from "fastify";
import { userRoutes } from "./modules/users/infrastructure/http/userRoutes";
import { companyRoutes } from "./modules/companies/infrastructure/http/companyRoutes";
import { requestRoutes } from "./modules/requests/infrastructure/http/requestRoutes";
import { quoteResponseRoutes } from "./modules/quote_responses/infrastructure/http/quoteResponseRoutes";
import { companyOfferRoutes } from "./modules/companyOffers/infrastructure/http/companyOfferRoutes";

export async function routes(app: FastifyInstance) {
    app.register(userRoutes, { prefix: '/users' });
    app.register(companyRoutes, { prefix: '/companies' });
    app.register(requestRoutes, { prefix: '/requests' });
    app.register(quoteResponseRoutes, { prefix: '/quote-responses' });
    app.register(companyOfferRoutes, { prefix: '/company-offers' });
}
