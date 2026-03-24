// src/modules/companies/infrastructure/persistence/PrismaCompanyRepository.ts
import { CompanyRepository, CompanyListResult } from "../../domain/repositories/company.repository";
import { Company } from "../../domain/entities/company.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaCompanyRepository implements CompanyRepository {
    async create(data: any): Promise<Company> {
        const created = await prisma.company.create({
            data: {
                trade_name: data.trade_name,
                legal_name: data.legal_name,
                tax_id: data.tax_id,
                founding_year: data.founding_year,
                bio: data.bio,
                logo_url: data.logo_url,
                sector: data.sector,
                company_type: data.company_type,
                interest: data.interest,
                approximate_volume: data.approximate_volume,

                // Nested writes
                locations: {
                    create: {
                        location_state: data.location_state,
                        location_city: data.location_city,
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
                    create: (data.payment_methods || []).map((method: any) => ({ method }))
                },
                categories_of_interest: {
                    create: (data.interest_categories || []).map((category: any) => ({ category }))
                }
            }
        });

        return this.mapToEntity(created);
    }

    async findById(id: string): Promise<Company | null> {
        const found = await prisma.company.findUnique({
            where: { id },
            relationLoadStrategy: 'join',
            include: {
                locations: true,
                contacts: true,
                commercial_profile: true,
                settings: true,
                payment_methods: true,
                categories_of_interest: true
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
                locations: true,
                contacts: true,
                commercial_profile: true,
                settings: true,
                payment_methods: true,
                categories_of_interest: true
            }
        });
        if (!found) return null;
        return this.mapToEntity(found);
    }

    async update(id: string, data: any): Promise<Company> {
        const updatePayload: any = {
            trade_name: data.trade_name,
            legal_name: data.legal_name,
            tax_id: data.tax_id,
            founding_year: data.founding_year,
            bio: data.bio,
            logo_url: data.logo_url,
            sector: data.sector,
            company_type: data.company_type,
            interest: data.interest,
            approximate_volume: data.approximate_volume,
        };

        // Nested updates (using upsert/updateMany for consistency)
        if (data.location_state || data.location_city || data.tax_address) {
            updatePayload.locations = {
                updateMany: {
                    where: { is_main_headquarters: true },
                    data: {
                        location_state: data.location_state,
                        location_city: data.location_city,
                        tax_address: data.tax_address,
                        national_coverage: data.national_coverage
                    }
                }
            };
        }

        if (data.contact_person || data.contact_role || data.whatsapp || data.corporate_email) {
            updatePayload.contacts = {
                updateMany: {
                    where: { is_primary: true },
                    data: {
                        contact_person: data.contact_person,
                        position: data.contact_role,
                        whatsapp: data.whatsapp,
                        corporate_email: data.corporate_email
                    }
                }
            };
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

        if (data.payment_methods) {
            updatePayload.payment_methods = {
                deleteMany: {},
                create: data.payment_methods.map((method: any) => ({ method }))
            };
        }

        if (data.interest_categories) {
            updatePayload.categories_of_interest = {
                deleteMany: {},
                create: data.interest_categories.map((category: any) => ({ category }))
            };
        }

        const updated = await prisma.company.update({
            where: { id },
            data: updatePayload
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
                    locations: true,
                    contacts: true,
                    commercial_profile: true,
                    settings: true,
                    payment_methods: true,
                    categories_of_interest: true,
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
        return new Company(
            db.id,
            db.trade_name,
            db.legal_name,
            db.tax_id,
            db.founding_year,
            db.bio,
            db.logo_url,
            db.sector,
            db.company_type,
            db.interest,
            db.approximate_volume,
            Number(db.average_rating),
            db.transaction_count,
            db.review_count,
            db.created_at,
            db.updated_at,
            db.locations,
            db.contacts,
            db.commercial_profile,
            db.settings,
            db.payment_methods,
            db.categories_of_interest
        );
    }
}
