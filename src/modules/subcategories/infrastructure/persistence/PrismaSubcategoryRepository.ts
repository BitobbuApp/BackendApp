import { prisma } from "../../../../shared/infrastructure/database";
import { SubcategoryEntity } from "../../domain/entities/subcategory.entity";
import { CreateSubcategoryData, SubcategoryRepository, UpdateSubcategoryData } from "../../domain/repositories/subcategory.repository";
import { SubcategoryConflictError, SubcategoryNotFoundError } from "../../domain/errors/subcategory.errors";

const ORDER_BY = [
    { category_id: 'asc' as const },
    { sort_order: 'asc' as const },
    { name_es: 'asc' as const },
];

export class PrismaSubcategoryRepository implements SubcategoryRepository {
    async listActive(): Promise<SubcategoryEntity[]> {
        const items = await prisma.subcategory.findMany({
            where: { is_active: true, category: { is_active: true } },
            orderBy: ORDER_BY,
        });
        return items.map((item) => this.mapToEntity(item));
    }

    async listAdmin(categoryId?: number): Promise<SubcategoryEntity[]> {
        const items = await prisma.subcategory.findMany({
            where: {
                ...(categoryId !== undefined && { category_id: categoryId }),
            },
            include: {
                category: { select: { name_es: true } },
                _count: { select: { companies: true } },
            },
            orderBy: ORDER_BY,
        });
        return items.map((item) => this.mapToEntity(item));
    }

    async findById(id: number): Promise<SubcategoryEntity | null> {
        const item = await prisma.subcategory.findUnique({
            where: { id },
            include: { category: { select: { name_es: true } } },
        });
        return item ? this.mapToEntity(item) : null;
    }

    async findActiveByIds(ids: number[]): Promise<SubcategoryEntity[]> {
        if (ids.length === 0) return [];
        const items = await prisma.subcategory.findMany({
            where: { id: { in: ids }, is_active: true, category: { is_active: true } },
        });
        return items.map((item) => this.mapToEntity(item));
    }

    async findCategory(categoryId: number): Promise<{ id: number; slug: string } | null> {
        return prisma.category.findUnique({
            where: { id: categoryId },
            select: { id: true, slug: true },
        });
    }

    async create(data: CreateSubcategoryData): Promise<SubcategoryEntity> {
        try {
            const created = await prisma.subcategory.create({
                data,
                include: { category: { select: { name_es: true } } },
            });
            return this.mapToEntity(created);
        } catch (error) {
            throw this.handlePrismaError(error);
        }
    }

    async update(id: number, data: UpdateSubcategoryData): Promise<SubcategoryEntity> {
        try {
            const updated = await prisma.subcategory.update({
                where: { id },
                data,
                include: { category: { select: { name_es: true } } },
            });
            return this.mapToEntity(updated);
        } catch (error) {
            throw this.handlePrismaError(error, id);
        }
    }

    async updateStatus(id: number, isActive: boolean): Promise<SubcategoryEntity> {
        try {
            const updated = await prisma.subcategory.update({
                where: { id },
                data: { is_active: isActive },
                include: { category: { select: { name_es: true } } },
            });
            return this.mapToEntity(updated);
        } catch (error) {
            throw this.handlePrismaError(error, id);
        }
    }

    private handlePrismaError(error: any, id?: number): Error {
        if (error?.code === 'P2002') return new SubcategoryConflictError();
        if (error?.code === 'P2025' && id !== undefined) return new SubcategoryNotFoundError(id);
        return error;
    }

    private mapToEntity(db: any): SubcategoryEntity {
        return new SubcategoryEntity(
            db.id,
            db.category_id,
            db.slug,
            db.name_es,
            db.name_en,
            db.is_active,
            db.sort_order ?? 0,
            db.category?.name_es ?? null,
            db._count?.companies ?? null,
        );
    }
}
