import { UseCase } from "../../../shared/application/useCase";
import { IAdminRepository } from "../domain/repositories/admin.repository";
import { PrismaAdminRepository } from "../infrastructure/persistence/PrismaAdminRepository";
import Joi from "joi";
import bcrypt from "bcrypt";

export class CreateAdminUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        full_name: Joi.string().required(),
        role: Joi.string().valid('superadmin', 'ops_admin', 'catalog_admin').required(),
        status: Joi.string().valid('active', 'inactive').default('active')
    });
    protected outputSchema = Joi.any();

    private readonly adminRepository: IAdminRepository;

    constructor(adminRepository?: IAdminRepository) {
        super();
        this.adminRepository = adminRepository || new PrismaAdminRepository();
    }

    protected async implementation(input: any): Promise<any> {
        const hashedPassword = await bcrypt.hash(input.password, 10);
        
        const admin = await this.adminRepository.create({
            ...input,
            password: hashedPassword
        });

        return {
            id: admin.id,
            email: admin.email,
            full_name: admin.full_name,
            role: admin.role,
            status: admin.status
        };
    }
}
