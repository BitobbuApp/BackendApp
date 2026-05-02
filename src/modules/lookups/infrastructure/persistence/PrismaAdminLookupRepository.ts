import { VerificationStatus } from "@prisma/client";
import { prisma } from "../../../../shared/infrastructure/database";
import { ApplicationError } from "../../../../shared/domain/error";
import { AdminLookupItemEntity, AdminLookupTableKey } from "../../domain/entities/adminLookupItem.entity";
import { AdminLookupRepository } from "../../domain/repositories/adminLookup.repository";

type LookupDefinition = {
    model?: string;
    idType?: 'string' | 'number';
    supportsCreate?: boolean;
    supportsUpdate?: boolean;
    supportsStatus?: boolean;
    list: () => Promise<AdminLookupItemEntity[]>;
    create?: (data: Partial<AdminLookupItemEntity>) => Promise<AdminLookupItemEntity>;
    update?: (id: string, data: Partial<AdminLookupItemEntity>) => Promise<AdminLookupItemEntity>;
    updateStatus?: (id: string, isActive: boolean) => Promise<AdminLookupItemEntity>;
};

function titleCaseFromCode(value: string): string {
    return value
        .trim()
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeCode(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, '_');
}

export class PrismaAdminLookupRepository implements AdminLookupRepository {
    private readonly definitions: Record<AdminLookupTableKey, LookupDefinition>;

    constructor() {
        this.definitions = {
            categories: {
                supportsCreate: true,
                supportsUpdate: true,
                supportsStatus: true,
                list: async () => {
                    const items = await prisma.category.findMany({ orderBy: { name_es: 'asc' } });
                    return items.map((item) => new AdminLookupItemEntity(item.id, item.slug, item.name_es, item.is_active));
                },
                create: async (data) => {
                    const created = await prisma.category.create({
                        data: {
                            slug: normalizeCode(data.code!),
                            name_es: data.label!,
                            name_en: titleCaseFromCode(data.code!),
                            icon: null,
                            is_active: data.is_active ?? true,
                        },
                    });
                    return new AdminLookupItemEntity(created.id, created.slug, created.name_es, created.is_active);
                },
                update: async (id, data) => {
                    const updated = await prisma.category.update({
                        where: { id: Number(id) },
                        data: {
                            ...(data.code !== undefined && { slug: normalizeCode(data.code) }),
                            ...(data.label !== undefined && { name_es: data.label, name_en: titleCaseFromCode(data.code ?? data.label) }),
                            ...(data.is_active !== undefined && { is_active: data.is_active }),
                        },
                    });
                    return new AdminLookupItemEntity(updated.id, updated.slug, updated.name_es, updated.is_active);
                },
                updateStatus: async (id, isActive) => {
                    const updated = await prisma.category.update({
                        where: { id: Number(id) },
                        data: { is_active: isActive },
                    });
                    return new AdminLookupItemEntity(updated.id, updated.slug, updated.name_es, updated.is_active);
                },
            },
            company_types: {
                supportsCreate: true,
                supportsUpdate: true,
                supportsStatus: true,
                list: async () => {
                    const items = await prisma.companyTypeDict.findMany({ orderBy: { name_es: 'asc' } });
                    return items.map((item) => new AdminLookupItemEntity(item.id, normalizeCode(item.name_en), item.name_es, item.is_active));
                },
                create: async (data) => {
                    const created = await prisma.companyTypeDict.create({
                        data: {
                            name_en: titleCaseFromCode(data.code!),
                            name_es: data.label!,
                            description: null,
                            is_active: data.is_active ?? true,
                        },
                    });
                    return new AdminLookupItemEntity(created.id, normalizeCode(created.name_en), created.name_es, created.is_active);
                },
                update: async (id, data) => {
                    const updated = await prisma.companyTypeDict.update({
                        where: { id: Number(id) },
                        data: {
                            ...(data.code !== undefined && { name_en: titleCaseFromCode(data.code) }),
                            ...(data.label !== undefined && { name_es: data.label }),
                            ...(data.is_active !== undefined && { is_active: data.is_active }),
                        },
                    });
                    return new AdminLookupItemEntity(updated.id, normalizeCode(updated.name_en), updated.name_es, updated.is_active);
                },
                updateStatus: async (id, isActive) => {
                    const updated = await prisma.companyTypeDict.update({
                        where: { id: Number(id) },
                        data: { is_active: isActive },
                    });
                    return new AdminLookupItemEntity(updated.id, normalizeCode(updated.name_en), updated.name_es, updated.is_active);
                },
            },
            payment_methods: {
                supportsCreate: true,
                supportsUpdate: true,
                supportsStatus: true,
                list: async () => {
                    const items = await prisma.paymentMethodDict.findMany({ orderBy: { name_es: 'asc' } });
                    return items.map((item) => new AdminLookupItemEntity(item.id, normalizeCode(item.name_en), item.name_es, item.is_active));
                },
                create: async (data) => {
                    const created = await prisma.paymentMethodDict.create({
                        data: {
                            name_en: titleCaseFromCode(data.code!),
                            name_es: data.label!,
                            is_active: data.is_active ?? true,
                        },
                    });
                    return new AdminLookupItemEntity(created.id, normalizeCode(created.name_en), created.name_es, created.is_active);
                },
                update: async (id, data) => {
                    const updated = await prisma.paymentMethodDict.update({
                        where: { id: Number(id) },
                        data: {
                            ...(data.code !== undefined && { name_en: titleCaseFromCode(data.code) }),
                            ...(data.label !== undefined && { name_es: data.label }),
                            ...(data.is_active !== undefined && { is_active: data.is_active }),
                        },
                    });
                    return new AdminLookupItemEntity(updated.id, normalizeCode(updated.name_en), updated.name_es, updated.is_active);
                },
                updateStatus: async (id, isActive) => {
                    const updated = await prisma.paymentMethodDict.update({
                        where: { id: Number(id) },
                        data: { is_active: isActive },
                    });
                    return new AdminLookupItemEntity(updated.id, normalizeCode(updated.name_en), updated.name_es, updated.is_active);
                },
            },
            units_of_measure: {
                supportsCreate: true,
                supportsUpdate: true,
                supportsStatus: true,
                list: async () => {
                    const items = await prisma.unitOfMeasureDict.findMany({ orderBy: { name_es: 'asc' } });
                    return items.map((item) => new AdminLookupItemEntity(item.id, item.abbreviation, item.name_es ?? item.name_en, item.is_active));
                },
                create: async (data) => {
                    const created = await prisma.unitOfMeasureDict.create({
                        data: {
                            abbreviation: data.code!,
                            name_en: data.label!,
                            name_es: data.label!,
                            is_active: data.is_active ?? true,
                        },
                    });
                    return new AdminLookupItemEntity(created.id, created.abbreviation, created.name_es ?? created.name_en, created.is_active);
                },
                update: async (id, data) => {
                    const updated = await prisma.unitOfMeasureDict.update({
                        where: { id: Number(id) },
                        data: {
                            ...(data.code !== undefined && { abbreviation: data.code }),
                            ...(data.label !== undefined && { name_en: data.label, name_es: data.label }),
                            ...(data.is_active !== undefined && { is_active: data.is_active }),
                        },
                    });
                    return new AdminLookupItemEntity(updated.id, updated.abbreviation, updated.name_es ?? updated.name_en, updated.is_active);
                },
                updateStatus: async (id, isActive) => {
                    const updated = await prisma.unitOfMeasureDict.update({
                        where: { id: Number(id) },
                        data: { is_active: isActive },
                    });
                    return new AdminLookupItemEntity(updated.id, updated.abbreviation, updated.name_es ?? updated.name_en, updated.is_active);
                },
            },
            verif_doc_types: {
                supportsCreate: true,
                supportsUpdate: true,
                supportsStatus: true,
                list: async () => {
                    const items = await prisma.verifDocTypeDict.findMany({ orderBy: { name_es: 'asc' } });
                    return items.map((item) => new AdminLookupItemEntity(item.id, normalizeCode(item.name_en), item.name_es ?? item.name_en, item.is_active));
                },
                create: async (data) => {
                    const created = await prisma.verifDocTypeDict.create({
                        data: {
                            name_en: titleCaseFromCode(data.code!),
                            name_es: data.label!,
                            instructions: null,
                            is_active: data.is_active ?? true,
                        },
                    });
                    return new AdminLookupItemEntity(created.id, normalizeCode(created.name_en), created.name_es ?? created.name_en, created.is_active);
                },
                update: async (id, data) => {
                    const updated = await prisma.verifDocTypeDict.update({
                        where: { id: Number(id) },
                        data: {
                            ...(data.code !== undefined && { name_en: titleCaseFromCode(data.code) }),
                            ...(data.label !== undefined && { name_es: data.label }),
                            ...(data.is_active !== undefined && { is_active: data.is_active }),
                        },
                    });
                    return new AdminLookupItemEntity(updated.id, normalizeCode(updated.name_en), updated.name_es ?? updated.name_en, updated.is_active);
                },
                updateStatus: async (id, isActive) => {
                    const updated = await prisma.verifDocTypeDict.update({
                        where: { id: Number(id) },
                        data: { is_active: isActive },
                    });
                    return new AdminLookupItemEntity(updated.id, normalizeCode(updated.name_en), updated.name_es ?? updated.name_en, updated.is_active);
                },
            },
            estimated_monthly_transactions: {
                supportsCreate: true,
                supportsUpdate: true,
                supportsStatus: true,
                list: async () => {
                    const items = await prisma.estimatedMonthlyTransaction.findMany({ orderBy: { range_name: 'asc' } });
                    return items.map((item) => new AdminLookupItemEntity(item.id, item.range_name, item.description_es ?? item.description ?? item.range_name, item.is_active));
                },
                create: async (data) => {
                    const created = await prisma.estimatedMonthlyTransaction.create({
                        data: {
                            range_name: normalizeCode(data.code!),
                            description: data.label!,
                            description_es: data.label!,
                            is_active: data.is_active ?? true,
                        },
                    });
                    return new AdminLookupItemEntity(created.id, created.range_name, created.description_es ?? created.description ?? created.range_name, created.is_active);
                },
                update: async (id, data) => {
                    const updated = await prisma.estimatedMonthlyTransaction.update({
                        where: { id },
                        data: {
                            ...(data.code !== undefined && { range_name: normalizeCode(data.code) }),
                            ...(data.label !== undefined && { description: data.label, description_es: data.label }),
                            ...(data.is_active !== undefined && { is_active: data.is_active }),
                        },
                    });
                    return new AdminLookupItemEntity(updated.id, updated.range_name, updated.description_es ?? updated.description ?? updated.range_name, updated.is_active);
                },
                updateStatus: async (id, isActive) => {
                    const updated = await prisma.estimatedMonthlyTransaction.update({
                        where: { id },
                        data: { is_active: isActive },
                    });
                    return new AdminLookupItemEntity(updated.id, updated.range_name, updated.description_es ?? updated.description ?? updated.range_name, updated.is_active);
                },
            },
            company_sizes: {
                supportsCreate: true,
                supportsUpdate: true,
                supportsStatus: true,
                list: async () => {
                    const items = await prisma.companySize.findMany({ orderBy: { display_label_es: 'asc' } });
                    return items.map((item) => new AdminLookupItemEntity(item.id, item.size_name, item.display_label_es, item.is_active));
                },
                create: async (data) => {
                    const created = await prisma.companySize.create({
                        data: {
                            size_name: normalizeCode(data.code!),
                            display_label: data.label!,
                            display_label_es: data.label!,
                            is_active: data.is_active ?? true,
                        },
                    });
                    return new AdminLookupItemEntity(created.id, created.size_name, created.display_label_es, created.is_active);
                },
                update: async (id, data) => {
                    const updated = await prisma.companySize.update({
                        where: { id },
                        data: {
                            ...(data.code !== undefined && { size_name: normalizeCode(data.code) }),
                            ...(data.label !== undefined && { display_label: data.label, display_label_es: data.label }),
                            ...(data.is_active !== undefined && { is_active: data.is_active }),
                        },
                    });
                    return new AdminLookupItemEntity(updated.id, updated.size_name, updated.display_label_es, updated.is_active);
                },
                updateStatus: async (id, isActive) => {
                    const updated = await prisma.companySize.update({
                        where: { id },
                        data: { is_active: isActive },
                    });
                    return new AdminLookupItemEntity(updated.id, updated.size_name, updated.display_label_es, updated.is_active);
                },
            },
            payment_conditions: {
                supportsCreate: false,
                supportsUpdate: false,
                supportsStatus: true,
                list: async () => {
                    const items = await prisma.paymentCondition.findMany({ orderBy: { days_to_due: 'asc' } });
                    return items.map((item) => new AdminLookupItemEntity(item.id, `${item.days_to_due}_days`, item.name_es, item.is_active));
                },
                updateStatus: async (id, isActive) => {
                    const updated = await prisma.paymentCondition.update({
                        where: { id },
                        data: { is_active: isActive },
                    });
                    return new AdminLookupItemEntity(updated.id, `${updated.days_to_due}_days`, updated.name_es, updated.is_active);
                },
            },
            payment_terms: {
                supportsCreate: false,
                supportsUpdate: false,
                supportsStatus: true,
                list: async () => this.definitions.payment_conditions.list(),
                updateStatus: async (id, isActive) => this.definitions.payment_conditions.updateStatus!(id, isActive),
            },
            verification_statuses: {
                supportsCreate: false,
                supportsUpdate: false,
                supportsStatus: false,
                list: async () => (Object.values(VerificationStatus) as string[]).map((status) => (
                    new AdminLookupItemEntity(status, status, status.replace(/_/g, ' '), true)
                )),
            },
        };
    }

    async list(tableKey: AdminLookupTableKey): Promise<AdminLookupItemEntity[]> {
        return this.getDefinition(tableKey).list();
    }

    async create(tableKey: AdminLookupTableKey, data: Partial<AdminLookupItemEntity>): Promise<AdminLookupItemEntity> {
        const definition = this.getDefinition(tableKey);
        if (!definition.create || !definition.supportsCreate) {
            throw new ApplicationError(400, `Create is not supported for ${tableKey}`);
        }

        try {
            return await definition.create(data);
        } catch (error: any) {
            this.handlePrismaError(error, tableKey);
            throw error;
        }
    }

    async update(tableKey: AdminLookupTableKey, id: string, data: Partial<AdminLookupItemEntity>): Promise<AdminLookupItemEntity> {
        const definition = this.getDefinition(tableKey);
        if (!definition.update || !definition.supportsUpdate) {
            throw new ApplicationError(400, `Update is not supported for ${tableKey}`);
        }

        try {
            return await definition.update(id, data);
        } catch (error: any) {
            this.handlePrismaError(error, tableKey);
            throw error;
        }
    }

    async updateStatus(tableKey: AdminLookupTableKey, id: string, isActive: boolean): Promise<AdminLookupItemEntity> {
        const definition = this.getDefinition(tableKey);
        if (!definition.updateStatus || !definition.supportsStatus) {
            throw new ApplicationError(400, `Status update is not supported for ${tableKey}`);
        }

        try {
            return await definition.updateStatus(id, isActive);
        } catch (error: any) {
            this.handlePrismaError(error, tableKey);
            throw error;
        }
    }

    private getDefinition(tableKey: AdminLookupTableKey): LookupDefinition {
        const definition = this.definitions[tableKey];
        if (!definition) {
            throw new ApplicationError(404, `Lookup table ${tableKey} is not supported`);
        }
        return definition;
    }

    private handlePrismaError(error: any, tableKey: string): never {
        if (error?.code === 'P2002') {
            throw new ApplicationError(409, `Duplicate record for ${tableKey}`);
        }
        if (error?.code === 'P2025') {
            throw new ApplicationError(404, `Record not found for ${tableKey}`);
        }
        throw error;
    }
}
