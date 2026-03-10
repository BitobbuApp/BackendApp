import { UseCase } from "../../../shared/application/useCase";
import { CompanyRepository } from "../domain/repositories/company.repository";
import { PrismaCompanyRepository } from "../infrastructure/persistence/PrismaCompanyRepository";
import { listCompaniesDtoResponseSchema } from "./dtos/company.dto";
import Joi from "joi";

interface ListCompaniesInput {
    sector?: string;
    interest?: string;
    page: number;
    limit: number;
}

export class ListCompaniesUseCase extends UseCase<ListCompaniesInput, any> {
    protected inputSchema: Joi.Schema = Joi.object({
        sector: Joi.string().optional(),
        interest: Joi.string().optional(),
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(10),
    });
    protected outputSchema: Joi.Schema = listCompaniesDtoResponseSchema;
    private readonly companyRepository: CompanyRepository;

    constructor() {
        super();
        this.companyRepository = new PrismaCompanyRepository();
    }

    protected async implementation(input: ListCompaniesInput): Promise<any> {
        const { page, limit, ...filters } = input;
        const result = await this.companyRepository.list(filters, page, limit);

        return {
            data: (result._raw || []).map((c: any) => ({
                id: c.id,
                trade_name: c.trade_name,
                legal_name: c.legal_name,
                tax_id: c.tax_id,
                sector: c.sector,
                company_type: c.company_type,
                interest: c.interest,
                approximate_volume: c.approximate_volume,
                logo_url: c.logo_url,
                bio: c.bio,
                founding_year: c.founding_year,
                average_rating: c.average_rating ? Number(c.average_rating) : 0,
                transaction_count: c.transaction_count,
                review_count: c.review_count,
                locations: (c.locations || []).map((l: any) => ({
                    id: l.id,
                    location_state: l.location_state,
                    location_city: l.location_city,
                    tax_address: l.tax_address,
                    national_coverage: l.national_coverage,
                    is_main_headquarters: l.is_main_headquarters,
                })),
                contacts: (c.contacts || []).map((ct: any) => ({
                    id: ct.id,
                    contact_person: ct.contact_person,
                    position: ct.position,
                    whatsapp: ct.whatsapp,
                    corporate_email: ct.corporate_email,
                    is_primary: ct.is_primary,
                })),
                commercial_profile: c.commercial_profile ? {
                    retention_agent: c.commercial_profile.retention_agent,
                    works_with_credit: c.commercial_profile.works_with_credit,
                } : null,
                settings: c.settings ? {
                    email_notifications: c.settings.email_notifications,
                    web_notifications: c.settings.web_notifications,
                } : null,
                payment_methods: (c.payment_methods || []).map((pm: any) => pm.method),
                categories_of_interest: (c.categories_of_interest || []).map((ci: any) => ci.category),
                created_at: c.created_at,
                updated_at: c.updated_at,
            })),
            total: result.total,
            page: result.page,
            limit: result.limit
        };
    }
}
