// src/modules/companyOffers/infrastructure/persistence/PrismaCompanyOfferRepository.ts
import { CompanyOfferRepository } from "../../domain/repositories/companyOffer.repository";
import { CompanyOffer, CompanyOfferPhoto } from "../../domain/entities/companyOffer.entity";
import { prisma } from '../../../../shared/infrastructure/database';
import { CategoryType, CompanyType, UnitOfMeasure } from "@prisma/client";

export class PrismaCompanyOfferRepository implements CompanyOfferRepository {
    async create(offer: Partial<CompanyOffer>): Promise<CompanyOffer> {
        const dataToCreate: any = {
            company_id: offer.company_id!,
            name: offer.name!,
            description: offer.description ?? null,
            category: offer.category as CategoryType | null,
            supplier_type: offer.supplier_type as CompanyType | null,
            base_price: offer.base_price ?? null,
            unit_of_measure: (offer.unit_of_measure as UnitOfMeasure) ?? 'Units',
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

        const created = await prisma.companyOffer.create({
            data: dataToCreate,
            include: {
                photos: true
            }
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<CompanyOffer | null> {
        const found = await prisma.companyOffer.findUnique({
            where: { id },
            include: { photos: true }
        });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByCompanyId(companyId: string): Promise<CompanyOffer[]> {
        const list = await prisma.companyOffer.findMany({
            where: { company_id: companyId },
            include: { photos: true }
        });
        return list.map((item: any) => this.mapToEntity(item));
    }

    async findAllWithPagination(page: number, limit: number): Promise<{ data: CompanyOffer[], total: number }> {
        const skip = (page - 1) * limit;
        const [total, list] = await Promise.all([
            prisma.companyOffer.count(),
            prisma.companyOffer.findMany({
                skip,
                take: limit,
                include: { photos: true },
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
            ...(offer.category !== undefined && { category: offer.category as CategoryType | null }),
            ...(offer.supplier_type !== undefined && { supplier_type: offer.supplier_type as CompanyType | null }),
            ...(offer.base_price !== undefined && { base_price: offer.base_price }),
            ...(offer.unit_of_measure !== undefined && { unit_of_measure: offer.unit_of_measure as UnitOfMeasure | null }),
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

        const updated = await prisma.companyOffer.update({
            where: { id },
            data: dataToUpdate,
            include: { photos: true }
        });
        return this.mapToEntity(updated);
    }

    async delete(id: string): Promise<void> {
        await prisma.companyOffer.delete({ where: { id } });
    }

    private mapToEntity(db: any): CompanyOffer {
        const photos = db.photos?.map((p: any) => new CompanyOfferPhoto(
            p.id, p.offer_id, p.url, p.sort_order, p.created_at
        )) || [];

        return new CompanyOffer(
            db.id,
            db.company_id,
            db.name,
            db.description,
            db.category,
            db.supplier_type,
            db.base_price ? Number(db.base_price) : null,
            db.unit_of_measure,
            db.moq,
            db.std_delivery_time,
            db.video_url,
            db.is_active,
            db.rating ? Number(db.rating) : 0,
            db.created_at,
            db.updated_at,
            photos
        );
    }
}
