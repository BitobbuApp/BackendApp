// src/modules/companyOffers/infrastructure/persistence/PrismaCompanyOfferRepository.ts
import { CompanyOfferRepository } from "../../domain/repositories/companyOffer.repository";
import { CompanyOffer, CompanyOfferPhoto } from "../../domain/entities/companyOffer.entity";
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

        const created = await prisma.companyOffer.create({
            data: dataToCreate,
            include: {
                photos: true,
                category: true,
                supplier_type: true,
                unit_of_measure: true,
            }
        });
        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<CompanyOffer | null> {
        const found = await prisma.companyOffer.findUnique({
            where: { id },
            include: { photos: true, category: true, supplier_type: true, unit_of_measure: true }
        });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByCompanyId(companyId: string): Promise<CompanyOffer[]> {
        const list = await prisma.companyOffer.findMany({
            where: { company_id: companyId },
            include: { photos: true, category: true, supplier_type: true, unit_of_measure: true }
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
                include: { photos: true, category: true, supplier_type: true, unit_of_measure: true },
                orderBy: { created_at: 'desc' }
            })
        ]);

        return {
            total,
            data: list.map((item: any) => this.mapToEntity(item))
        };
    }

    async searchMarketplace(filters: any, pagination: { page: number; limit: number }): Promise<{ data: CompanyOffer[], total: number }> {
        const { page, limit } = pagination;
        const skip = (page - 1) * limit;

        const where: any = { is_active: true };

        if (filters.searchTerm) {
            where.OR = [
                { name: { contains: filters.searchTerm, mode: 'insensitive' } },
                { description: { contains: filters.searchTerm, mode: 'insensitive' } }
            ];
        }

        if (filters.categoryId) {
            where.category_id = filters.categoryId;
        }

        if (filters.supplierTypeId) {
            where.supplier_type_id = filters.supplierTypeId;
        }

        if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
            where.base_price_usd = {};
            if (filters.minPrice !== undefined) where.base_price_usd.gte = filters.minPrice;
            if (filters.maxPrice !== undefined) where.base_price_usd.lte = filters.maxPrice;
        }

        if (filters.countryId || filters.stateId) {
            where.company = {
                locations: {
                    some: {
                        ...(filters.countryId && { country_id: filters.countryId }),
                        ...(filters.stateId && { state_id: filters.stateId })
                    }
                }
            };
        }

        let orderBy: any = { created_at: 'desc' }; // 'newest' default
        if (filters.sortBy === 'price_asc') {
            orderBy = { base_price_usd: 'asc' };
        } else if (filters.sortBy === 'price_desc') {
            orderBy = { base_price_usd: 'desc' };
        } else if (filters.sortBy === 'rating_desc') {
            orderBy = { rating: 'desc' };
        }

        const [total, list] = await Promise.all([
            prisma.companyOffer.count({ where }),
            prisma.companyOffer.findMany({
                where,
                skip,
                take: limit,
                orderBy,
                include: {
                    photos: true,
                    category: true,
                    supplier_type: true,
                    unit_of_measure: true,
                    company: {
                        include: {
                            locations: true
                        }
                    }
                }
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

        const updated = await prisma.companyOffer.update({
            where: { id },
            data: dataToUpdate,
            include: { photos: true, category: true, supplier_type: true, unit_of_measure: true }
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

        let company_details = null;
        if (db.company) {
            company_details = {
                trade_name: db.company.trade_name,
                legal_name: db.company.legal_name,
                logo_url: db.company.logo_url,
                average_rating: db.company.average_rating ? Number(db.company.average_rating) : 0,
                locations: db.company.locations?.map((l: any) => ({
                    country_id: l.country_id,
                    state_id: l.state_id,
                    city_id: l.city_id
                })) || []
            };
        }

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
            db.created_at,
            db.updated_at,
            photos,
            company_details
        );
    }
}
