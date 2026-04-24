import { UseCase } from "../../../shared/application/useCase";
import { CompanyRepository } from "../domain/repositories/company.repository";
import { PrismaCompanyRepository } from "../infrastructure/persistence/PrismaCompanyRepository";
import { updateCompanyDtoRequestSchema, createCompanyDtoResponseSchema } from "./dtos/company.dto";
import Joi from "joi";
import { CompanyNotFoundError } from "../domain/errors/company.errors";
import { UploadDocumentUseCase } from "../../documents/application/UploadDocumentUseCase";
import { storageService } from "../../../shared/infrastructure/storage/storageInstance";

interface UpdateCompanyInput {
    id: string;
    trade_name?: string;
    legal_name?: string;
    tax_id?: string;
    bio?: string;
    logo_url?: string;
    sector_id?: number | null;
    company_type_id?: number | null;
    can_buy?: boolean;
    can_sell?: boolean;
    founding_year?: number | null;
    monthly_transactions_id?: string | null;
    company_size_id?: string | null;

    country_id?: number | null;
    state_id?: number | null;
    city_id?: number | null;
    tax_address?: string;
    national_coverage?: boolean;

    contact_person?: string;
    contact_role?: string;
    whatsapp?: string;
    corporate_email?: string;

    retention_agent?: boolean;
    works_with_credit?: boolean;

    email_notifications?: boolean;
    web_notifications?: boolean;
    whatsapp_notifications?: boolean;

    payment_method_ids?: number[];
    interest_category_ids?: number[];

    rawFiles?: Array<{ file_name: string; buffer: Buffer; mime_type: string }>;
}

export class UpdateCompanyUseCase extends UseCase<UpdateCompanyInput, any> {
    protected inputSchema: Joi.Schema = updateCompanyDtoRequestSchema.keys({
        id: Joi.string().uuid().required()
    });
    protected outputSchema: Joi.Schema = createCompanyDtoResponseSchema;
    private readonly companyRepository: CompanyRepository;

    constructor() {
        super();
        this.companyRepository = new PrismaCompanyRepository();
    }

    protected async implementation(data: UpdateCompanyInput): Promise<any> {
        const { id, rawFiles, ...updateData } = data;

        const existing = await this.companyRepository.findById(id);
        if (!existing) {
            throw new CompanyNotFoundError(id);
        }

        // Upload logo to R2 if a file was sent
        if (rawFiles && rawFiles.length > 0) {
            const logoFile = rawFiles[0]; // Only take the first file as logo
            if (logoFile && logoFile.buffer) {
                const uploadUseCase = new UploadDocumentUseCase(storageService);
                const result = await uploadUseCase.execute({
                    tenantId: id,
                    buffer: logoFile.buffer
                });

                const publicUrlBase = process.env.S3_PUBLIC_URL || '';
                updateData.logo_url = `${publicUrlBase}/${result.fileKey}`;
            }
        }

        const updatedCompany = await this.companyRepository.update(id, updateData);

        return {
            id: updatedCompany.id,
            trade_name: updatedCompany.trade_name,
            legal_name: updatedCompany.legal_name,
            tax_id: updatedCompany.tax_id,
            sector: updatedCompany.sector,
            logo_url: updatedCompany.logo_url,
            created_at: updatedCompany.created_at!
        };
    }
}
