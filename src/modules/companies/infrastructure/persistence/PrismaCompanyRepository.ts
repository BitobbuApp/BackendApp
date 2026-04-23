// src/modules/companies/infrastructure/persistence/PrismaCompanyRepository.ts
import { CompanyRepository, CompanyListResult } from "../../domain/repositories/company.repository";
import { Company } from "../../domain/entities/company.entity";
import { prisma } from '../../../../shared/infrastructure/database';
import { VENEZUELA_COUNTRY_ID } from '../../../../shared/constants/geo.constants';

export class PrismaCompanyRepository implements CompanyRepository {
    async create(data: any): Promise<Company> {
        const dataPayload: any = {
            trade_name: data.trade_name,
            legal_name: data.legal_name,
            tax_id: data.tax_id,
            bio: data.bio,
            logo_url: data.logo_url,
            can_buy: data.can_buy ?? false,
            can_sell: data.can_sell ?? false,
            ...(data.monthly_transactions_id ? { monthly_transactions: { connect: { id: data.monthly_transactions_id } } } : {}),
            ...(data.company_size_id ? { company_size: { connect: { id: data.company_size_id } } } : {}),
            ...(data.sector_id ? { sector_ref: { connect: { id: data.sector_id } } } : {}),
            ...(data.company_type_id ? { company_type_ref: { connect: { id: data.company_type_id } } } : {}),

            // Nested writes
            locations: {
                create: {
                    // Country is always forced to Venezuela (brute force overwrite)
                    country: { connect: { id: VENEZUELA_COUNTRY_ID } },
                    ...(data.state_id !== undefined && data.state_id !== null
                        ? { state: { connect: { id: data.state_id } } }
                        : {}),
                    ...(data.city_id !== undefined && data.city_id !== null
                        ? { city: { connect: { id: data.city_id } } }
                        : {}),
                    tax_address: data.tax_address,
                    is_main_headquarters: true,
                    national_coverage: data.national_coverage || false
                }
            },
            contacts: {
                create: {
                    contact_person: data.contact_person,
                    position: data.contact_role,
                    whatsapp: data.whatsapp,
                    corporate_email: data.corporate_email,
                    is_primary: true
                }
            },
            commercial_profile: {
                create: {
                    retention_agent: data.retention_agent || false,
                    works_with_credit: data.works_with_credit || false
                }
            },
            settings: {
                create: {
                    email_notifications: data.email_notifications ?? true,
                    web_notifications: data.web_notifications ?? true,
                    whatsapp_notifications: data.whatsapp_notifications ?? false
                }
            },
            payment_methods: {
                create: (data.payment_method_ids || []).map((methodId: number) => ({
                    method: { connect: { id: methodId } }
                }))
            },
            categories_of_interest: {
                create: (data.interest_category_ids || []).map((categoryId: number) => ({
                    category: { connect: { id: categoryId } }
                }))
            }
        };
        const created = await prisma.company.create({
            data: dataPayload,
            include: {
                sector_ref: true,
                company_type_ref: true,
                payment_methods: { include: { method: true } },
                categories_of_interest: { include: { category: true } }
            }
        });

        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<Company | null> {
        const found = await prisma.company.findUnique({
            where: { id },
            relationLoadStrategy: 'join',
            include: {
                locations: {
                    include: {
                        state: true,
                        city: true,
                    }
                },
                contacts: true,
                commercial_profile: true,
                settings: true,
                payment_methods: { include: { method: true } },
                categories_of_interest: { include: { category: true } },
                sector_ref: true,
                company_type_ref: true,
                verification: true,
                verif_documents: { include: { type: true } }
            }
        });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async findByTaxId(taxId: string): Promise<Company | null> {
        if (!taxId) return null;
        const found = await prisma.company.findUnique({
            where: { tax_id: taxId },
            relationLoadStrategy: 'join',
            include: {
                locations: {
                    include: {
                        state: true,
                        city: true,
                    }
                },
                contacts: true,
                commercial_profile: true,
                settings: true,
                payment_methods: { include: { method: true } },
                categories_of_interest: { include: { category: true } },
                sector_ref: true,
                company_type_ref: true,
                verification: true,
                verif_documents: { include: { type: true } }
            }
        });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async update(id: string, data: any): Promise<Company> {
        const primaryContact = await prisma.companyContact.findFirst({
            where: { company_id: id, is_primary: true }
        });

        const updatePayload: any = {
            trade_name: data.trade_name,
            legal_name: data.legal_name,
            tax_id: data.tax_id,
            bio: data.bio,
            logo_url: data.logo_url,
            ...(data.sector_id !== undefined && {
                sector_ref: data.sector_id === null ? { disconnect: true } : { connect: { id: data.sector_id } }
            }),
            ...(data.company_type_id !== undefined && {
                company_type_ref: data.company_type_id === null ? { disconnect: true } : { connect: { id: data.company_type_id } }
            }),
            ...(data.can_buy !== undefined && { can_buy: data.can_buy }),
            ...(data.can_sell !== undefined && { can_sell: data.can_sell }),
            ...(data.founding_year !== undefined && { founding_year: data.founding_year }),
            ...(data.monthly_transactions_id !== undefined && {
                monthly_transactions: data.monthly_transactions_id === null
                    ? { disconnect: true }
                    : { connect: { id: data.monthly_transactions_id } }
            }),
            ...(data.company_size_id !== undefined && {
                company_size: data.company_size_id === null
                    ? { disconnect: true }
                    : { connect: { id: data.company_size_id } }
            }),
        };

        // Nested updates (using upsert/updateMany for consistency)
        if (data.country_id !== undefined || data.state_id !== undefined || data.city_id !== undefined || data.tax_address !== undefined || data.national_coverage !== undefined) {
            updatePayload.locations = {
                updateMany: {
                    where: { is_main_headquarters: true },
                    data: {
                        tax_address: data.tax_address,
                        national_coverage: data.national_coverage
                    }
                }
            };
        }

        if (data.contact_person || data.contact_role || data.whatsapp || data.corporate_email) {
            if (primaryContact) {
                updatePayload.contacts = {
                    update: {
                        where: { id: primaryContact.id },
                        data: {
                            contact_person: data.contact_person,
                            position: data.contact_role,
                            whatsapp: data.whatsapp,
                            corporate_email: data.corporate_email
                        }
                    }
                };
            } else {
                updatePayload.contacts = {
                    create: {
                        is_primary: true,
                        contact_person: data.contact_person,
                        position: data.contact_role,
                        whatsapp: data.whatsapp,
                        corporate_email: data.corporate_email
                    }
                };
            }
        }

        if (data.retention_agent !== undefined || data.works_with_credit !== undefined) {
            updatePayload.commercial_profile = {
                upsert: {
                    create: {
                        retention_agent: data.retention_agent || false,
                        works_with_credit: data.works_with_credit || false
                    },
                    update: {
                        retention_agent: data.retention_agent,
                        works_with_credit: data.works_with_credit
                    }
                }
            };
        }

        if (data.email_notifications !== undefined || data.web_notifications !== undefined || data.whatsapp_notifications !== undefined) {
            updatePayload.settings = {
                upsert: {
                    create: {
                        email_notifications: data.email_notifications ?? true,
                        web_notifications: data.web_notifications ?? true,
                        whatsapp_notifications: data.whatsapp_notifications ?? false
                    },
                    update: {
                        email_notifications: data.email_notifications,
                        web_notifications: data.web_notifications,
                        whatsapp_notifications: data.whatsapp_notifications
                    }
                }
            };
        }

        if (data.payment_method_ids) {
            updatePayload.payment_methods = {
                deleteMany: {},
                create: data.payment_method_ids.map((methodId: number) => ({
                    method: { connect: { id: methodId } }
                }))
            };
        }

        if (data.interest_category_ids) {
            updatePayload.categories_of_interest = {
                deleteMany: {},
                create: data.interest_category_ids.map((categoryId: number) => ({
                    category: { connect: { id: categoryId } }
                }))
            };
        }

        const updated = await prisma.company.update({
            where: { id },
            data: updatePayload,
            include: {
                sector_ref: true,
                company_type_ref: true,
                payment_methods: { include: { method: true } },
                categories_of_interest: { include: { category: true } }
            }
        });
        return this.mapToEntity(updated);
    }

    async list(filters?: any, page: number = 1, limit: number = 10): Promise<CompanyListResult> {
        const skip = (page - 1) * limit;
        const where = filters || {};

        const [total, data] = await Promise.all([
            prisma.company.count({ where }),
            prisma.company.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    locations: {
                        include: {
                            state: true,
                            city: true,
                        }
                    },
                    contacts: true,
                    commercial_profile: true,
                    settings: true,
                    payment_methods: { include: { method: true } },
                    categories_of_interest: { include: { category: true } },
                    sector_ref: true,
                    company_type_ref: true,
                    verification: true,
                    verif_documents: { include: { type: true } },
                    _count: {
                        select: { offers: true }
                    }
                }
            })
        ]);

        return {
            data: data.map((item: any) => this.mapToEntity(item)),
            total,
            page,
            limit,
            _raw: data
        };
    }

    private mapToEntity(db: any): Company {
        const paymentMethods = db.payment_methods?.map((pm: any) => ({
            id: pm.method.id,
            name: pm.method.name_es,
        })) ?? [];

        const categoriesOfInterest = db.categories_of_interest?.map((ci: any) => ({
            id: ci.category.id,
            name: ci.category.name_es,
        })) ?? [];

        let verificationInfo = null;
        if (db.verification) {
            verificationInfo = {
                status: db.verification.status,
                rejection_reason: db.verification.rejection_reason,
                verified_at: db.verification.verified_at,
                documents: db.verif_documents?.map((doc: any) => ({
                    id: doc.id,
                    type_id: doc.type_id,
                    type_name: doc.type?.name_es ?? doc.type?.name_en ?? '',
                    url: doc.url,
                    status: doc.status,
                    notes: doc.notes,
                    created_at: doc.created_at,
                    reviewed_at: doc.reviewed_at
                })) ?? []
            };
        }

        return new Company(
            db.id,
            db.trade_name,
            db.legal_name,
            db.tax_id,
            db.bio,
            db.logo_url,
            db.sector_ref?.name_es ?? null,
            db.company_type_ref?.name_es ?? null,
            db.can_buy,
            db.can_sell,
            db.is_founder_badge ?? false,
            db.founding_year ?? null,
            db.monthly_transactions_id ?? null,
            db.company_size_id ?? null,
            Number(db.average_rating || 0),
            db.transaction_count || 0,
            db.review_count || 0,
            db.seller_review_count || 0,
            db.buyer_review_count || 0,
            Number(db.avg_quality || 0),
            Number(db.avg_compliance_seller || 0),
            Number(db.avg_communication_seller || 0),
            Number(db.avg_price || 0),
            Number(db.avg_compliance_buyer || 0),
            Number(db.avg_reliability || 0),
            Number(db.avg_communication_buyer || 0),
            db._count?.offers || 0,
            db.created_at,
            db.updated_at,
            db.locations,
            db.contacts,
            db.commercial_profile,
            db.settings,
            paymentMethods,
            categoriesOfInterest,
            verificationInfo
        );
    }

    async getReviews(id: string, page: number = 1, limit: number = 10): Promise<{ items: any[], total: number }> {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            prisma.review.findMany({
                where: { evaluated_company_id: id },
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    author: {
                        select: {
                            trade_name: true,
                            logo_url: true
                        }
                    }
                }
            }),
            prisma.review.count({ where: { evaluated_company_id: id } })
        ]);
        return { items, total };
    }
}
