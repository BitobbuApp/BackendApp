import Joi from 'joi';
import { UseCase } from '../../../shared/application/useCase';
import { PrismaCompanyRepository } from '../../companies/infrastructure/persistence/PrismaCompanyRepository';
import { CompanyRepository } from '../../companies/domain/repositories/company.repository';
import { PrismaRequestRepository } from '../../requests/infrastructure/persistence/PrismaRequestRepository';
import { RequestRepository } from '../../requests/domain/repositories/request.repository';
import { MailgunEmailAdapter } from '../../../shared/infrastructure/notifications/mailgunEmailAdapter';
import { EmailService } from '../../../shared/application/services/email.service';
import logger from '../../../shared/infrastructure/logger';

interface SendRfqMatchEmailInput {
    companyId: string; // The supplier's company ID
    requestId: string;
}

export class SendRfqMatchEmailUseCase extends UseCase<SendRfqMatchEmailInput, void> {
    protected inputSchema = Joi.object({
        companyId: Joi.string().uuid().required(),
        requestId: Joi.string().uuid().required()
    });
    protected outputSchema = Joi.any();

    private readonly companyRepo: CompanyRepository;
    private readonly requestRepo: RequestRepository;
    private readonly emailService: MailgunEmailAdapter; // Or use the interface if properly registered

    constructor() {
        super();
        this.companyRepo = new PrismaCompanyRepository();
        this.requestRepo = new PrismaRequestRepository();
        this.emailService = new MailgunEmailAdapter();
    }

    protected async implementation(data: SendRfqMatchEmailInput): Promise<void> {
        // 1. Fetch Supplier to check settings and get contact email
        const supplier = await this.companyRepo.findById(data.companyId);
        if (!supplier) {
            logger.warn(`Supplier not found for RFQ match email: ${data.companyId}`);
            return;
        }

        if (supplier.settings?.email_notifications === false) {
            logger.info({ companyId: data.companyId }, `Email notifications disabled for supplier (settings.email_notifications is false)`);
            return;
        }

        logger.debug({ companyId: data.companyId, hasSettings: !!supplier.settings }, "Supplier found and notifications are enabled");

        const primaryContact = supplier.contacts?.find(c => c.is_primary) || supplier.contacts?.[0];
        if (!primaryContact?.corporate_email) {
            logger.warn({ companyId: data.companyId, contactsCount: supplier.contacts?.length }, `No corporate email found for supplier`);
            return;
        }

        logger.debug({ email: primaryContact.corporate_email }, "Primary contact email identified");

        // 2. Fetch Request to get RFQ details
        const request = await this.requestRepo.findById(data.requestId);
        if (!request) {
            logger.warn(`Request not found for RFQ match email: ${data.requestId}`);
            return;
        }

        // 3. Fetch Buyer Company to get the name and location
        let buyerCompanyName = 'Bitobbu Buyer';
        let location = 'N/A';

        if (request.company_id) {
            const buyer = await this.companyRepo.findById(request.company_id);
            if (buyer) {
                buyerCompanyName = buyer.trade_name || buyer.legal_name || 'Bitobbu Buyer';
                
                // Determine Location from Buyer Company Info
                if (buyer.locations && buyer.locations.length > 0) {
                    const mainLocation = buyer.locations.find((l: any) => l.is_main_headquarters) || buyer.locations[0];
                    const stateName = mainLocation.state?.name;
                    const cityName = mainLocation.city?.name;
                    
                    if (cityName && stateName) {
                        location = `${cityName}, ${stateName}`;
                    } else if (stateName) {
                        location = stateName;
                    } else if (cityName) {
                        location = cityName;
                    }
                }
            }
        }

        // 5. Format date
        const dateLimit = request.expiration_date 
            ? new Date(request.expiration_date).toLocaleDateString('es-ES') 
            : 'Sin fecha límite';

        logger.info({
            to: primaryContact.corporate_email,
            template: 'rfq_match',
            buyer: buyerCompanyName,
            product: request.product_service
        }, "Preparing to send RFQ match email via Mailgun");

        // 6. Send Email
        await this.emailService.sendTemplate({
            to: primaryContact.corporate_email,
            templateKey: 'rfq_match',
            variables: {
                company_name: buyerCompanyName,
                product_name: request.product_service,
                qty: request.quantity?.toString() || '1',
                location: location,
                date_limit: dateLimit
            }
        });

        logger.info(`Sent RFQ match email to ${primaryContact.corporate_email} for Request ${data.requestId}`);
    }
}
