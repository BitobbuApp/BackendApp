// src/modules/companyOffers/infrastructure/persistence/PrismaCompanyOfferRepository.ts
import { CompanyOfferRepository } from "../../domain/repositories/companyOffer.repository";
import { CompanyOffer, CompanyOfferPhoto, CompanyOfferPricingTier } from "../../domain/entities/companyOffer.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaCompanyOfferRepository implements CompanyOfferRepository {
    async create(offer: Partial<CompanyOffer>): Promise<CompanyOffer> {
        const dataToCreate: any = {
            company_id: offer.company_id!,
            name: offer.name!,
            description: offer.description ?? null,
            ...(offer.category_id !== undefined && { category_id: offer.category_id }),
            ...(offer.supplier_type_id !== undefined && { supplier_type_id: offer.supplier_type_id }),
            base_price_usd: offer.base_price_usd ?? null,
            ...(offer.unit_id !== undefined && { unit_id: offer.unit_id }),
            moq: offer.moq ?? 1,
            std_delivery_time: offer.std_delivery_time ?? null,
            video_url: offer.video_url ?? null,
            is_active: offer.is_active ?? true,
            rating: offer.rating ?? 0.00,
        };

        if (offer.photos && offer.photos.length > 0) {
            dataToCreate.photos = {
                create: offer.photos.map((photo: Partial<CompanyOfferPhoto>) => ({
                    url: photo.url!,
                    sort_order: photo.sort_order ?? 0
                }))
            };
        }

        if (offer.pricing_tiers && offer.pricing_tiers.length > 0) {
            dataToCreate.pricing_tiers = {
                create: offer.pricing_tiers.map((tier: Partial<CompanyOfferPricingTier>) => ({
                    min_quantity: tier.min_quantity!,
                    max_quantity: tier.max_quantity ?? null,
                    price_usd: tier.price_usd!
                }))
            };
        }

        const created = await prisma.companyOffer.create({
            data: dataToCreate,
            include: {
                photos: true,
                pricing_tiers: true,
                category: true,
                supplier_type: true,
                unit_of_measure: true,
            }
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<CompanyOffer | null> {
        const found = await prisma.companyOffer.findFirst({
            where: { id, deleted_at: null },
            include: { photos: true, pricing_tiers: true, category: true, supplier_type: true, unit_of_measure: true }
        });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByCompanyId(companyId: string): Promise<CompanyOffer[]> {
        const list = await prisma.companyOffer.findMany({
            where: { company_id: companyId, deleted_at: null },
            include: { photos: true, pricing_tiers: true, category: true, supplier_type: true, unit_of_measure: true }
        });
        return list.map((item: any) => this.mapToEntity(item));
    }

    async findAllWithPagination(page: number, limit: number): Promise<{ data: CompanyOffer[], total: number }> {
        const skip = (page - 1) * limit;
        const [total, list] = await Promise.all([
            prisma.companyOffer.count({ where: { deleted_at: null } }),
            prisma.companyOffer.findMany({
                skip,
                take: limit,
                where: { deleted_at: null },
                include: { photos: true, pricing_tiers: true, category: true, supplier_type: true, unit_of_measure: true },
                orderBy: { created_at: 'desc' }
            })
        ]);

        return {
            total,
            data: list.map((item: any) => this.mapToEntity(item))
        };
    }

    async update(id: string, offer: Partial<CompanyOffer>): Promise<CompanyOffer> {
        const dataToUpdate: any = {
            ...(offer.name !== undefined && { name: offer.name }),
            ...(offer.description !== undefined && { description: offer.description }),
            ...(offer.category_id !== undefined && { category_id: offer.category_id }),
            ...(offer.supplier_type_id !== undefined && { supplier_type_id: offer.supplier_type_id }),
            ...(offer.base_price_usd !== undefined && { base_price_usd: offer.base_price_usd }),
            ...(offer.unit_id !== undefined && { unit_id: offer.unit_id }),
            ...(offer.moq !== undefined && { moq: offer.moq }),
            ...(offer.std_delivery_time !== undefined && { std_delivery_time: offer.std_delivery_time }),
            ...(offer.video_url !== undefined && { video_url: offer.video_url }),
            ...(offer.is_active !== undefined && { is_active: offer.is_active }),
            ...(offer.rating !== undefined && { rating: offer.rating }),
        };

        if (offer.photos !== undefined) {
            // Recreate photos: delete all existing and create new ones
            dataToUpdate.photos = {
                deleteMany: {},
                create: offer.photos.map((photo: Partial<CompanyOfferPhoto>) => ({
                    url: photo.url!,
                    sort_order: photo.sort_order ?? 0
                }))
            };
        }

        if (offer.pricing_tiers !== undefined) {
            dataToUpdate.pricing_tiers = {
                deleteMany: {},
                create: offer.pricing_tiers.map((tier: Partial<CompanyOfferPricingTier>) => ({
                    min_quantity: tier.min_quantity!,
                    max_quantity: tier.max_quantity ?? null,
                    price_usd: tier.price_usd!
                }))
            };
        }

        const updated = await prisma.companyOffer.update({
            where: { id },
            data: dataToUpdate,
            include: { photos: true, pricing_tiers: true, category: true, supplier_type: true, unit_of_measure: true }
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await prisma.companyOffer.update({
            where: { id },
            data: { deleted_at: new Date(), is_active: false }
        });
    }

    private mapToEntity = (db: any): CompanyOffer => {
        const photos = db.photos?.map((p: any) => new CompanyOfferPhoto(
            p.id, p.offer_id, p.url, p.sort_order, p.created_at
        )) || [];

        const tiers = db.pricing_tiers?.map((t: any) => new CompanyOfferPricingTier(
            t.id, t.offer_id, t.min_quantity, t.max_quantity, t.price_usd ? Number(t.price_usd) : 0, t.created_at
        )) || [];

        return new CompanyOffer(
            db.id,
            db.company_id,
            db.name,
            db.description,
            db.category_id,
            db.category?.name_es ?? null,
            db.supplier_type_id,
            db.supplier_type?.name_es ?? null,
            db.base_price_usd ? Number(db.base_price_usd) : null,
            db.unit_id,
            db.unit_of_measure?.name_es ?? db.unit_of_measure?.name_en ?? null,
            db.moq,
            db.std_delivery_time,
            db.video_url,
            db.is_active,
            db.rating ? Number(db.rating) : 0,
            db.deleted_at ?? null,
            db.created_at,
            db.updated_at,
            photos,
            tiers
        );
    }
}
