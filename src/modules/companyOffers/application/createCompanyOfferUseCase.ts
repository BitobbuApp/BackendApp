// src/modules/companyOffers/application/createCompanyOfferUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { CompanyOfferRepository } from "../domain/repositories/companyOffer.repository";
import { PrismaCompanyOfferRepository } from "../infrastructure/persistence/PrismaCompanyOfferRepository";
import { createCompanyOfferDtoRequestSchema, companyOfferDtoResponseSchema } from "./dtos/companyOffer.dto";
import Joi from "joi";
import { storageService } from "../../../shared/infrastructure/storage/storageInstance";
import { UploadDocumentUseCase } from "../../documents/application/UploadDocumentUseCase";

interface CreateCompanyOfferPhotoDto {
    url: string;
    sort_order?: number;
}

interface CreateCompanyOfferPricingTierDto {
    min_quantity: number;
    max_quantity?: number | null;
    price_usd: number;
}

interface CreateCompanyOfferDto {
    company_id: string;
    name: string;
    description?: string | null;
    category_id?: number | null;
    supplier_type_id?: number | null;
    base_price_usd?: number | null;
    unit_id?: number | null;
    moq?: number | null;
    std_delivery_time?: string | null;
    video_url?: string | null;
    is_active?: boolean;
    rating?: number | null;
    photos?: CreateCompanyOfferPhotoDto[];
    pricing_tiers?: CreateCompanyOfferPricingTierDto[];
    rawFiles?: Array<{ file_name: string; buffer: Buffer; mime_type: string }>;
}

export class CreateCompanyOfferUseCase extends UseCase<CreateCompanyOfferDto, any> {
    protected inputSchema: Joi.Schema = createCompanyOfferDtoRequestSchema;
    protected outputSchema: Joi.Schema = companyOfferDtoResponseSchema;
    private readonly companyOfferRepository: CompanyOfferRepository;
    private readonly uploadDocumentUseCase: UploadDocumentUseCase;

    constructor() {
        super();
        this.companyOfferRepository = new PrismaCompanyOfferRepository();
        this.uploadDocumentUseCase = new UploadDocumentUseCase(storageService);
    }

    protected async implementation(data: CreateCompanyOfferDto): Promise<any> {
        const payload: any = { ...data };
        
        const files: Array<{ url: string; sort_order?: number }> = [];
        
        if (data.rawFiles && data.rawFiles.length > 0) {
            const publicUrlBase = process.env.S3_PUBLIC_URL || 'https://pub-763f58343d734ddfbcf74e591370f038.r2.dev';

            console.log("Raw files to upload: ", data.rawFiles.map(f => ({ file_name: f.file_name, mime_type: f.mime_type })));

            for (const file of data.rawFiles) {
                try {
                    const result = await this.uploadDocumentUseCase.execute({
                        tenantId: data.company_id,
                        buffer: file.buffer
                    });
                    files.push({ 
                        url: `${publicUrlBase}/${result.fileKey}`, 
                        sort_order: files.length 
                    });
                } catch (err) {
                    console.error("Error uploading product image:", err);
                    throw err;
                }
            }
        }

        const { rawFiles, files: dummyFiles, ...repoData } = payload;
        
        // Combine manually provided photo URLs with uploaded ones
        const existingPhotos = data.photos || [];
        (repoData as any).photos = [...existingPhotos, ...files];

        if (repoData.base_price_usd !== undefined) {
            repoData.base_price_usd = Number(repoData.base_price_usd);
        }

        return await this.companyOfferRepository.create(repoData);
    }
}
