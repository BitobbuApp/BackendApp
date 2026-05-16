import { UseCase } from "../../../shared/application/useCase";
import { IAdminRepository } from "../domain/repositories/admin.repository";
import { PrismaAdminRepository } from "../infrastructure/persistence/PrismaAdminRepository";
import Joi from "joi";
import bcrypt from "bcrypt";
import { ApplicationError } from "../../../shared/domain/error";

export class UpdateAdminUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        id: Joi.string().uuid().required(),
        email: Joi.string().email().optional(),
        password: Joi.string().min(6).optional(),
        full_name: Joi.string().optional(),
        role: Joi.string().valid('superadmin', 'ops_admin', 'catalog_admin').optional(),
        status: Joi.string().valid('active', 'inactive').optional()
    });
    protected outputSchema = Joi.any();

    private readonly adminRepository: IAdminRepository;

    constructor(adminRepository?: IAdminRepository) {
        super();
        this.adminRepository = adminRepository || new PrismaAdminRepository();
    }

    protected async implementation(input: any): Promise<any> {
        const { id, password, ...data } = input;
        
        const existing = await this.adminRepository.findById(id);
        if (!existing) {
            throw new ApplicationError(404, "Admin not found");
        }

        const updateData: any = { ...data };
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updated = await this.adminRepository.update(id, updateData);

        return {
            id: updated.id,
            email: updated.email,
            full_name: updated.full_name,
            role: updated.role,
            status: updated.status
        };
    }
}
