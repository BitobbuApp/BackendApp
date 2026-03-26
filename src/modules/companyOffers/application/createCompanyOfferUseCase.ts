// src/modules/companyOffers/application/createCompanyOfferUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { CompanyOfferRepository } from "../domain/repositories/companyOffer.repository";
import { PrismaCompanyOfferRepository } from "../infrastructure/persistence/PrismaCompanyOfferRepository";
import { createCompanyOfferDtoRequestSchema, companyOfferDtoResponseSchema } from "./dtos/companyOffer.dto";
import Joi from "joi";

interface CreateCompanyOfferPhotoDto {
    url: string;
    sort_order?: number;
}

interface CreateCompanyOfferDto {
    company_id: string;
    name: string;
    description?: string | null;
    category?: string | null;
    supplier_type?: string | null;
    base_price?: number | null;
    unit_of_measure?: string | null;
    moq?: number | null;
    std_delivery_time?: string | null;
    video_url?: string | null;
    is_active?: boolean;
    rating?: number | null;
    photos?: CreateCompanyOfferPhotoDto[];
}

export class CreateCompanyOfferUseCase extends UseCase<CreateCompanyOfferDto, any> {
    protected inputSchema: Joi.Schema = createCompanyOfferDtoRequestSchema;
    protected outputSchema: Joi.Schema = companyOfferDtoResponseSchema;
    private readonly companyOfferRepository: CompanyOfferRepository;

    constructor() {
        super();
        this.companyOfferRepository = new PrismaCompanyOfferRepository();
    }

    protected async implementation(data: CreateCompanyOfferDto): Promise<any> {
        const payload: any = { ...data };
        // Maps photos if needed for the repo
        if (payload.photos) {
            payload.photos = payload.photos.map((p: any) => ({
                url: p.url,
                sort_order: p.sort_order ?? 0
            }));
        }
        return await this.companyOfferRepository.create(payload);
    }
}
