import { UseCase } from "../../../shared/application/useCase";
import { IAdminRepository } from "../domain/repositories/admin.repository";
import { PrismaAdminRepository } from "../infrastructure/persistence/PrismaAdminRepository";
import { adminMeResponseSchema } from "./dtos/admin-auth.dto";
import Joi from "joi";
import { AdminNotFoundError, AdminInactiveError } from "../domain/errors/admin.errors";

export class GetAdminMeUseCase extends UseCase<string, any> {
    protected inputSchema = Joi.string();
    protected outputSchema = adminMeResponseSchema;

    private readonly adminRepository: IAdminRepository;

    constructor(adminRepository?: IAdminRepository) {
        super();
        this.adminRepository = adminRepository || new PrismaAdminRepository();
    }

    protected async implementation(adminId: string): Promise<any> {
        const admin = await this.adminRepository.findById(adminId);
        if (!admin) {
            throw new AdminNotFoundError();
        }

        if (admin.status !== 'active') {
            throw new AdminInactiveError();
        }

        return {
            admin: {
                id: admin.id,
                email: admin.email,
                full_name: admin.full_name,
                role: admin.role,
                status: admin.status
            }
        };
    }
}
