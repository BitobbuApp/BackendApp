import { Admin } from "../entities/admin.entity";

export interface IAdminRepository {
    findByEmail(email: string): Promise<Admin | null>;
    findById(id: string): Promise<Admin | null>;
    updateLastLogin(id: string): Promise<void>;
    logAuditAction(adminId: string, action: string, resource: string, resourceId?: string | null, payload?: any): Promise<void>;
}
