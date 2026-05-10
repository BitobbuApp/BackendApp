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
            logger.info(`Email notifications disabled for supplier: ${data.companyId}`);
            return;
        }

        const primaryContact = supplier.contacts?.find(c => c.is_primary) || supplier.contacts?.[0];
        if (!primaryContact?.corporate_email) {
            logger.warn(`No corporate email found for supplier: ${data.companyId}`);
            return;
        }

        // 2. Fetch Request to get RFQ details
        const request = await this.requestRepo.findById(data.requestId);
        if (!request) {
            logger.warn(`Request not found for RFQ match email: ${data.requestId}`);
            return;
        }

        // 3. Fetch Buyer Company to get the name
        let buyerCompanyName = 'Bitobbu Buyer';
        if (request.company_id) {
            const buyer = await this.companyRepo.findById(request.company_id);
            if (buyer) {
                buyerCompanyName = buyer.trade_name || buyer.legal_name || 'Bitobbu Buyer';
            }
        }

        // 4. Determine Location string from Request
        // Assuming request has city_id, state_id, country_id, but usually we just want a string or fetch the names.
        // For now, if we can't easily resolve city names without another repo, we might just pass a generic or leave it blank if not available.
        // Let's check if request has a location object populated by the repo, or we use reach_service if location isn't populated.
        const location = request.reach_service || 'N/A';

        // 5. Format date
        const dateLimit = request.expiration_date 
            ? new Date(request.expiration_date).toLocaleDateString('es-ES') 
            : 'Sin fecha límite';

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
