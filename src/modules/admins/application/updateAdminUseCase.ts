import { UseCase } from "../../../shared/application/useCase";
import { IAdminRepository } from "../domain/repositories/admin.repository";
import { PrismaAdminRepository } from "../infrastructure/persistence/PrismaAdminRepository";
import { AdminNotFoundError } from "../domain/errors/admin.errors";
import { updateAdminDtoSchema, createAdminResponseSchema } from "./dtos/admin-auth.dto";
import bcrypt from 'bcrypt';

export class UpdateAdminUseCase extends UseCase<any, any> {
    protected inputSchema = updateAdminDtoSchema;
    protected outputSchema = createAdminResponseSchema;

    private readonly adminRepository: IAdminRepository;

    constructor(adminRepository?: IAdminRepository) {
        super();
        this.adminRepository = adminRepository || new PrismaAdminRepository();
    }

    protected async implementation(input: { id: string, data: any }): Promise<any> {
        const { id, data } = input;

        const admin = await this.adminRepository.findById(id);
        if (!admin) {
            throw new AdminNotFoundError();
        }

        const updateData = { ...data };

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const updatedAdmin = await this.adminRepository.update(id, updateData);

        return {
            admin: {
                email: updatedAdmin.email,
                full_name: updatedAdmin.full_name,
                role: updatedAdmin.role,
                status: updatedAdmin.status
            }
        };
    }
}
