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
import { notificationRoutes } from "./modules/notifications/infrastructure/http/notificationRoutes";

// Admin imports
import { adminAuthRoutes } from "./modules/admins/infrastructure/http/adminAuthRoutes";
import { adminManagementRoutes } from "./modules/admins/infrastructure/http/adminManagementRoutes";
import { adminDashboardRoutes } from "./modules/dashboard/infrastructure/http/adminDashboardRoutes";
import { adminUserRoutes } from "./modules/users/infrastructure/http/adminUserRoutes";
import { adminVerificationRoutes } from "./modules/companies/infrastructure/http/adminVerificationRoutes";
import { adminSubscriptionRoutes } from "./modules/subscriptions/infrastructure/http/adminSubscriptionRoutes";
import { adminPlanRoutes } from "./modules/plansCatalog/infrastructure/http/adminPlanRoutes";
import { adminLookupRoutes } from "./modules/lookups/infrastructure/http/adminLookupRoutes";
import { adminGeographyRoutes } from "./modules/countries/infrastructure/http/adminGeographyRoutes";
import { adminCityRoutes } from "./modules/cities/infrastructure/http/adminCityRoutes";
import { adminRfqRoutes } from "./modules/requests/infrastructure/http/adminRfqRoutes";
import { adminQuoteResponseRoutes } from "./modules/quote_responses/infrastructure/http/adminQuoteResponseRoutes";
import { adminTransactionRoutes } from "./modules/transactions/infrastructure/http/adminTransactionRoutes";
import { adminDeliveryMethodRoutes } from "./modules/deliveryMethods/infrastructure/http/adminDeliveryMethodRoutes";
import { adminCurrencyRoutes } from "./modules/currencies/infrastructure/http/adminCurrencyRoutes";
import { adminExchangeRateRoutes } from "./modules/exchangeRates/infrastructure/http/adminExchangeRateRoutes";

export async function routes(app: FastifyInstance) {
    // User / Public Routes
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
    app.register(notificationRoutes, { prefix: '/notifications' });

    // Admin Routes
    app.register(adminAuthRoutes, { prefix: '/admin/auth' });
    app.register(adminManagementRoutes, { prefix: '/admin/admins' });
    app.register(adminDashboardRoutes, { prefix: '/admin/dashboard' });
    app.register(adminUserRoutes, { prefix: '/admin/users' });
    app.register(adminVerificationRoutes, { prefix: '/admin/verifications' });
    app.register(adminSubscriptionRoutes, { prefix: '/admin/subscriptions' });
    app.register(adminPlanRoutes, { prefix: '/admin/plans' });
    app.register(adminLookupRoutes, { prefix: '/admin/lookups' });
    app.register(adminGeographyRoutes, { prefix: '/admin/geography' });
    app.register(adminCityRoutes, { prefix: '/admin/geography/cities' });
    app.register(adminDeliveryMethodRoutes, { prefix: '/admin/delivery-methods' });
    app.register(adminCurrencyRoutes, { prefix: '/admin/currencies' });
    app.register(adminExchangeRateRoutes, { prefix: '/admin/exchange-rates' });
    app.register(adminRfqRoutes, { prefix: '/admin/rfqs' });
    app.register(adminQuoteResponseRoutes, { prefix: '/admin/quote-responses' });
    app.register(adminTransactionRoutes, { prefix: '/admin/transactions' });
}
