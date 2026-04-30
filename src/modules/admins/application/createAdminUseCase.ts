import { UseCase } from "../../../shared/application/useCase";
import { IAdminRepository } from "../domain/repositories/admin.repository";
import { PrismaAdminRepository } from "../infrastructure/persistence/PrismaAdminRepository";
import { AdminAlreadyExistsError } from "../domain/errors/admin.errors";
import { createAdminDtoSchema, createAdminResponseSchema } from "./dtos/admin-auth.dto";
import bcrypt from 'bcrypt';


export class CreateAdminUseCase extends UseCase<any, any> {
    protected inputSchema = createAdminDtoSchema;
    protected outputSchema = createAdminResponseSchema;

    private readonly adminRepository: IAdminRepository;

    constructor() {
        super();
        this.adminRepository = new PrismaAdminRepository();
    }

    protected async implementation(data: any): Promise<any> {
        const { email, password } = data;

        const admin = await this.adminRepository.findByEmail(email);
        if (admin) {
            throw new AdminAlreadyExistsError();
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newAdmin = await this.adminRepository.create({ ...data, password: hashedPassword, email });
        const result = {
            full_name: newAdmin.full_name,
            email: newAdmin.email,
            role: newAdmin.role,
            status: newAdmin.status,
        }
        return { admin: result };
    }
}
