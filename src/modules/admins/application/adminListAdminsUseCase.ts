import { UseCase } from "../../../shared/application/useCase";
import { IAdminRepository } from "../domain/repositories/admin.repository";
import { PrismaAdminRepository } from "../infrastructure/persistence/PrismaAdminRepository";
import Joi from "joi";

export class AdminListAdminsUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({});
    protected outputSchema = Joi.any();

    private readonly adminRepository: IAdminRepository;

    constructor(adminRepository?: IAdminRepository) {
        super();
        this.adminRepository = adminRepository || new PrismaAdminRepository();
    }

    protected async implementation(): Promise<any> {
        const admins = await this.adminRepository.findAll();
        
        return admins.map(admin => ({
            id: admin.id,
            email: admin.email,
            full_name: admin.full_name,
            role: admin.role,
            status: admin.status,
            last_login_at: admin.last_login_at,
            created_at: admin.created_at
        }));
    }
}
