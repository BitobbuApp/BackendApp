import { UserRepository } from "../../domain/repositories/user.repository";
import { User } from "../../domain/entities/user.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaUserRepository implements UserRepository {
    private buildAdminWhere(params: {
        search?: string,
        status?: string,
        company_id?: string,
        profile_type?: string,
    }) {
        const { search, status, company_id, profile_type } = params;
        const where: any = {};

        if (status) {
            where.is_active = status === 'active';
        }

        if (company_id) {
            where.company_id = company_id;
        }

        if (profile_type === 'buyer') {
            where.company = { ...(where.company || {}), can_buy: true, can_sell: false };
        }

        if (profile_type === 'supplier') {
            where.company = { ...(where.company || {}), can_buy: false, can_sell: true };
        }

        if (profile_type === 'both') {
            where.company = { ...(where.company || {}), can_buy: true, can_sell: true };
        }

        if (search) {
            where.OR = [
                { first_name: { contains: search, mode: 'insensitive' } },
                { last_name: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { company: { trade_name: { contains: search, mode: 'insensitive' } } },
                { company: { legal_name: { contains: search, mode: 'insensitive' } } },
            ];
        }

        return where;
    }

    private mapAdminUser(item: any) {
        const profileType = item.company?.can_buy && item.company?.can_sell
            ? 'both'
            : item.company?.can_buy
                ? 'buyer'
                : item.company?.can_sell
                    ? 'supplier'
                    : 'unknown';

        return {
            id: item.id,
            first_name: item.first_name,
            last_name: item.last_name,
            full_name: `${item.first_name} ${item.last_name}`,
            email: item.email,
            company_id: item.company?.id,
            company_name: item.company?.legal_name || item.company?.trade_name,
            status: item.is_active ? 'active' : 'inactive',
            verification_status: item.company?.verification?.status || 'pending',
            created_at: item.created_at,
            profile_type: profileType,
        };
    }

    async create(user: User): Promise<User> {
        try {
            // id is intentionally omitted — the DB generates it via @default(uuid())
        const createdUser = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email,
                    password: user.password,
                    salt: user.salt ?? 10,
                }
            });
            // Create company if trade_name is provided (registration flow)
            if (user.trade_name) {
                const companyCreated = await tx.company.create({
                    data: {
                        trade_name: user.trade_name,
                        sector_id: user.sector_id ?? null,
                        can_buy: user.can_buy ?? false,
                        can_sell: user.can_sell ?? false,
                        // founding_year is NOT set at registration — updated later via profile
                    }
                });
                await tx.companyLocation.create({
                    data: {
                        company_id: companyCreated.id,
                        // country_id already coerced to VENEZUELA_COUNTRY_ID in the use case
                        country_id: (user as any).country_id ?? null,
                        state_id: (user as any).state_id ?? null,
                        is_main_headquarters: true,
                    }
                });

                // Also initialize the operating country for the company based on the selected country
                if ((user as any).country_id) {
                    await tx.companyOperatingCountry.create({
                        data: {
                            company_id: companyCreated.id,
                            country_id: (user as any).country_id,
                        }
                    });
                }

                await tx.user.update({
                    where: { id: newUser.id },
                    data: { company_id: companyCreated.id }
                });
            }
            return newUser;
        });
        return new User(
            createdUser.id, 
            createdUser.company_id, 
            createdUser.first_name, 
            createdUser.last_name,
            createdUser.email, 
            createdUser.password, 
            createdUser.salt, 
            null, 
            null,
            null,
            null,
            null, // state_id
            null, // can_buy
            null, // can_sell
            createdUser.is_active, 
            createdUser.last_access,
            createdUser.created_at, 
            createdUser.updated_at
        );    
        } catch (error) {
            throw error;
        }
    }

    async findByEmail(email: string): Promise<User | null> {
        const found = await prisma.user.findUnique({
            where: { email },
            include: { company: { select: { id: true } } },
            relationLoadStrategy: 'join',
        });
        if (!found) return null;
        return new User(
            found.id, 
            found.company?.id || null, 
            found.first_name, 
            found.last_name,
            found.email, 
            found.password, 
            found.salt, 
            null, // trade_name
            null, // founding_year
            null, // country_id
            null, // sector_id
            null, // state_id
            null, // can_buy
            null, // can_sell
            found.is_active, 
            found.last_access,
            found.created_at, 
            found.updated_at
        );
    }

    async findById(id: string): Promise<User | null> {
        const found = await prisma.user.findUnique({
            where: { id },
            include: { company: { select: { id: true } } },
            relationLoadStrategy: 'join'
        });
        if (!found) return null;
        return new User(
            found.id, 
            found.company?.id || null, 
            found.first_name, 
            found.last_name,
            found.email, 
            found.password, 
            found.salt, 
            null, // trade_name
            null, // founding_year
            null, // country_id
            null, // sector_id
            null, // state_id
            null, // can_buy
            null, // can_sell
            found.is_active, 
            found.last_access,
            found.created_at, 
            found.updated_at
        );
    }

    async update(user: User): Promise<User> {
        const updated = await prisma.user.update({
            where: { id: user.id },
            data: {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                password: user.password,
                salt: user.salt ?? 10,
                is_active: user.is_active ?? true,
                last_access: user.last_access,
                company_id: user.company_id
            }
        });
        return new User(
            updated.id, 
            updated.company_id, 
            updated.first_name, 
            updated.last_name,
            updated.email, 
            updated.password, 
            updated.salt, 
            null, 
            null,
            null,
            null,
            null, // state_id
            null, // can_buy
            null, // can_sell
            updated.is_active, 
            updated.last_access,
            updated.created_at, 
            updated.updated_at
        );
    }

    async delete(id: string): Promise<void> {
        await prisma.user.delete({ where: { id } });
    }

    async findAllAdmin(params: { 
        page: number, 
        limit: number, 
        search?: string, 
        status?: string,
        company_id?: string,
        profile_type?: string,
    }): Promise<{ items: any[], total: number }> {
        const { page, limit, ...filters } = params;
        const skip = (page - 1) * limit;
        const where = this.buildAdminWhere(filters);

        const [items, total] = await Promise.all([
            prisma.user.findMany({
                where,
                skip,
                take: limit,
                orderBy: { created_at: 'desc' },
                include: {
                    company: {
                        include: {
                            verification: {
                                select: { status: true }
                            }
                        },
                    }
                }
            }) as Promise<any[]>,
            prisma.user.count({ where })
        ]);

        return {
            items: items.map(item => this.mapAdminUser(item)),
            total
        };
    }

    async findAdminExportBatch(params: {
        limit: number;
        cursor?: string;
        search?: string;
        status?: string;
        company_id?: string;
        profile_type?: string;
    }): Promise<any[]> {
        const { limit, cursor, ...filters } = params;
        const where = this.buildAdminWhere(filters);

        const items = await prisma.user.findMany({
            where,
            take: limit,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor },
            }),
            orderBy: { id: 'asc' },
            include: {
                company: {
                    include: {
                        verification: {
                            select: { status: true }
                        },
                        locations: {
                            include: { country: true, state: true }
                        },
                        contacts: true,
                        payment_methods: {
                            include: { method: true }
                        },
                        subscriptions: {
                            include: { plan: true },
                            orderBy: { created_at: 'desc' }
                        },
                        categories_of_interest: {
                            include: { category: true }
                        },
                        social_media: true,
                        sector_ref: true,
                        company_type_ref: true,
                        monthly_transactions: true,
                        company_size: true,
                    }
                }
            }
        }) as any[];

        return items.map((item) => ({
            ...this.mapAdminUser(item),
            registration_date: item.created_at,
            company: item.company ? {
                id: item.company.id,
                company_name: item.company.legal_name,
                trade_name: item.company.trade_name,
                status: item.company.verification?.status || 'pending',
                tax_id: item.company.tax_id,
                bio: item.company.bio,
                website: item.company.website,
                founding_year: item.company.founding_year,
                can_buy: item.company.can_buy,
                can_sell: item.company.can_sell,
                locations: item.company.locations,
                contacts: item.company.contacts,
                payment_methods: item.company.payment_methods,
                subscriptions: item.company.subscriptions,
                categories_of_interest: item.company.categories_of_interest,
                social_media: item.company.social_media,
                sector: item.company.sector_ref,
                company_type: item.company.company_type_ref,
                monthly_transactions: item.company.monthly_transactions,
                company_size: item.company.company_size,
            } : null
        }));
    }

    async findByIdAdmin(id: string): Promise<any> {
        const found = await prisma.user.findUnique({
            where: { id },
            include: {
                company: {
                    include: {
                        locations: {
                            include: { country: true, state: true }
                        },
                        contacts: true,
                        payment_methods: {
                            include: { method: true }
                        },
                        verification: true,
                        subscriptions: {
                            include: { plan: true },
                            orderBy: { created_at: 'desc' }
                        },
                        categories_of_interest: {
                            include: { category: true }
                        },
                        social_media: true,
                        sector_ref: true,
                        company_type_ref: true,
                        monthly_transactions: true,
                        company_size: true,
                        commercial_profile: true
                    }
                }
            }
        }) as any;

        if (!found) return null;

        return {
            id: found.id,
            first_name: found.first_name,
            last_name: found.last_name,
            full_name: `${found.first_name} ${found.last_name}`,
            email: found.email,
            status: found.is_active ? 'active' : 'inactive',
            registration_date: found.created_at,
            company: found.company ? {
                id: found.company.id,
                company_name: found.company.legal_name,
                trade_name: found.company.trade_name,
                status: found.company.verification?.status || 'pending',
                tax_id: found.company.tax_id,
                bio: found.company.bio,
                website: found.company.website,
                founding_year: found.company.founding_year,
                can_buy: found.company.can_buy,
                can_sell: found.company.can_sell,
                locations: found.company.locations,
                contacts: found.company.contacts,
                payment_methods: found.company.payment_methods,
                subscriptions: found.company.subscriptions,
                categories_of_interest: found.company.categories_of_interest,
                social_media: found.company.social_media,
                sector: found.company.sector_ref,
                company_type: found.company.company_type_ref,
                monthly_transactions: found.company.monthly_transactions,
                company_size: found.company.company_size,
                commercial_profile: found.company.commercial_profile
            } : null
        };
    }
}
