import { UserRepository } from "../../domain/repositories/user.repository";
import { User } from "../../domain/entities/user.entity";
import { prisma } from '../../../../shared/infrastructure/database';

export class PrismaUserRepository implements UserRepository {

    async create(user: User): Promise<User> {
        // id is intentionally omitted — the DB generates it via @default(uuid())
        const created = await prisma.user.create({
            data: {
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                password: user.password,
                salt: user.salt ?? 10,
            }
        });

        return new User(
            created.id, created.first_name, created.last_name,
            created.email, created.password, created.salt,
            created.is_active, created.last_access,
            created.created_at, created.updated_at
        );
    }

    async findByEmail(email: string): Promise<User | null> {
        const found = await prisma.user.findUnique({ where: { email } });
        if (!found) return null;
        return new User(
            found.id, found.first_name, found.last_name,
            found.email, found.password, found.salt,
            found.is_active, found.last_access,
            found.created_at, found.updated_at
        );
    }

    async findById(id: string): Promise<User | null> {
        const found = await prisma.user.findUnique({ where: { id } });
        if (!found) return null;
        return new User(
            found.id, found.first_name, found.last_name,
            found.email, found.password, found.salt,
            found.is_active, found.last_access,
            found.created_at, found.updated_at
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
            }
        });
        return new User(
            updated.id, updated.first_name, updated.last_name,
            updated.email, updated.password, updated.salt,
            updated.is_active, updated.last_access,
            updated.created_at, updated.updated_at
        );
    }

    async delete(id: string): Promise<void> {
        await prisma.user.delete({ where: { id } });
    }
}