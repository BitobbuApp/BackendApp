// src/modules/companyOffers/application/updateCompanyOfferUseCase.ts
import { UseCase } from "../../../shared/application/useCase";
import { CompanyOfferRepository } from "../domain/repositories/companyOffer.repository";
import { PrismaCompanyOfferRepository } from "../infrastructure/persistence/PrismaCompanyOfferRepository";
import { CompanyOfferNotFoundError } from "../domain/errors/companyOffer.errors";
import { updateCompanyOfferDtoRequestSchema, companyOfferDtoResponseSchema } from "./dtos/companyOffer.dto";
import Joi from "joi";

interface UpdateCompanyOfferPhotoDto {
    url: string;
    sort_order?: number;
}

interface UpdateCompanyOfferPricingTierDto {
    min_quantity: number;
    max_quantity?: number | null;
    price_usd: number;
}

interface UpdateCompanyOfferDto {
    id: string;
    name?: string;
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
    photos?: UpdateCompanyOfferPhotoDto[];
    pricing_tiers?: UpdateCompanyOfferPricingTierDto[];
}

export class UpdateCompanyOfferUseCase extends UseCase<UpdateCompanyOfferDto, any> {
    protected inputSchema: Joi.Schema = updateCompanyOfferDtoRequestSchema;
    protected outputSchema: Joi.Schema = companyOfferDtoResponseSchema;
    private readonly companyOfferRepository: CompanyOfferRepository;

    constructor() {
        super();
        this.companyOfferRepository = new PrismaCompanyOfferRepository();
    }

    protected async implementation(data: UpdateCompanyOfferDto): Promise<any> {
        const existingOffer = await this.companyOfferRepository.findById(data.id);
        if (!existingOffer) {
            throw new CompanyOfferNotFoundError(data.id);
        }

        const payload: any = { ...data };
        if (payload.base_price_usd !== undefined) {
            payload.base_price_usd = payload.base_price_usd;
        }
        // Maps photos if needed for the repo
        if (payload.photos) {
            payload.photos = payload.photos.map((p: any) => ({
                url: p.url,
                sort_order: p.sort_order ?? 0
            }));
        }

        // Maps pricing tiers if needed for the repo
        if (payload.pricing_tiers) {
            payload.pricing_tiers = payload.pricing_tiers.map((t: any) => ({
                min_quantity: t.min_quantity,
                max_quantity: t.max_quantity ?? null,
                price_usd: t.price_usd
            }));
        }

        return await this.companyOfferRepository.update(data.id, payload);
    }
}
