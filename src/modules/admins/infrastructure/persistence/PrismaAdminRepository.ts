import { IAdminRepository } from "../../domain/repositories/admin.repository";
import { Admin } from "../../domain/entities/admin.entity";
import { prisma } from "../../../../shared/infrastructure/database";

export class PrismaAdminRepository implements IAdminRepository {
    async findByEmail(email: string): Promise<Admin | null> {
        const admin = await prisma.admin.findUnique({ where: { email } });
        if (!admin) return null;
        return this.mapToEntity(admin);
    }

    async findById(id: string): Promise<Admin | null> {
        const admin = await prisma.admin.findUnique({ where: { id } });
        if (!admin) return null;
        return this.mapToEntity(admin);
    }

    async updateLastLogin(id: string): Promise<void> {
        await prisma.admin.update({
            where: { id },
            data: { last_login_at: new Date() }
        });
    }

    async logAuditAction(adminId: string, action: string, resource: string, resourceId?: string | null, payload?: any): Promise<void> {
        await prisma.adminAuditLog.create({
            data: {
                admin_id: adminId,
                action,
                resource,
                resource_id: resourceId || null,
                payload: payload || null
            }
        });
    }

    private mapToEntity(dbAdmin: any): Admin {
        return new Admin(
            dbAdmin.id,
            dbAdmin.email,
            dbAdmin.full_name,
            dbAdmin.role,
            dbAdmin.status,
            dbAdmin.last_login_at,
            dbAdmin.created_at,
            dbAdmin.updated_at,
            dbAdmin.password
        );
    }
}
