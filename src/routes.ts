import { FastifyInstance } from "fastify";
import { userRoutes } from "./modules/users/infrastructure/http/userRoutes";
import { companyRoutes } from "./modules/companies/infrastructure/http/companyRoutes";
import { requestRoutes } from "./modules/requests/infrastructure/http/requestRoutes";
import { quoteResponseRoutes } from "./modules/quote_responses/infrastructure/http/quoteResponseRoutes";
import { companyOfferRoutes } from "./modules/companyOffers/infrastructure/http/companyOfferRoutes";
import { transactionRoutes } from "./modules/transactions/infrastructure/http/transactionRoutes";
import { conversationRoutes } from "./modules/conversations/infrastructure/http/conversationRoutes";
import { messageRoutes } from "./modules/messages/infrastructure/http/messageRoutes";
import { metaDataRoutes } from "./modules/metaData/infrastructure/http/metaDataRoutes";
import { countryRoutes } from "./modules/countries/infrastructure/http/countryRoutes";
import { stateRoutes } from "./modules/states/infrastructure/http/stateRoutes";
import { userOnboardingStatusRoutes } from "./modules/userOnboardingStatus/infrastructure/http/userOnboardingStatusRoutes";
import { deliveryMethodRoutes } from "./modules/deliveryMethods/infrastructure/http/deliveryMethodRoutes";
import { reviewRoutes } from "./modules/reviews/infrastructure/http/reviewRoutes";
import { dashboardRoutes } from "./modules/dashboard/infrastructure/http/dashboardRoutes";

export async function routes(app: FastifyInstance) {
    app.register(userRoutes, { prefix: '/users' });
    app.register(companyRoutes, { prefix: '/companies' });
    app.register(requestRoutes, { prefix: '/requests' });
    app.register(quoteResponseRoutes, { prefix: '/quote-responses' });
    app.register(companyOfferRoutes, { prefix: '/company-offers' });
    app.register(transactionRoutes, { prefix: '/transactions' });
    app.register(conversationRoutes, { prefix: '/conversations' });
    app.register(messageRoutes, { prefix: '/messages' });
    app.register(metaDataRoutes, { prefix: '/metadata' });
    app.register(countryRoutes, { prefix: '/countries' });
    app.register(stateRoutes, { prefix: '/states' });
    app.register(userOnboardingStatusRoutes, { prefix: '/onboarding-status' });
    app.register(dashboardRoutes, { prefix: '/dashboard' });
    app.register(deliveryMethodRoutes, { prefix: '/delivery-methods' });
    app.register(reviewRoutes, { prefix: '/reviews' });
}
