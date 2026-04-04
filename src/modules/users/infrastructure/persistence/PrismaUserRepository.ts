import { UserRepository } from "../../domain/repositories/user.repository";
import { User } from "../../domain/entities/user.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaUserRepository implements UserRepository {

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
            null, 
            null,
            null,
            null,
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
            null, 
            null,
            null,
            null,
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
            updated.is_active, 
            updated.last_access,
            updated.created_at, 
            updated.updated_at
        );
    }

    async delete(id: string): Promise<void> {
        await prisma.user.delete({ where: { id } });
    }
}
