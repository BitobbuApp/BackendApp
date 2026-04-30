import { UseCase } from "../../../shared/application/useCase";
import { IAdminRepository } from "../domain/repositories/admin.repository";
import { PrismaAdminRepository } from "../infrastructure/persistence/PrismaAdminRepository";
import { adminLoginDtoSchema, adminLoginResponseSchema } from "./dtos/admin-auth.dto";
import { AdminInvalidCredentialsError, AdminInactiveError } from "../domain/errors/admin.errors";
import { JwtService } from "../../../shared/application/services/jwtService";
import bcrypt from 'bcrypt';

export class LoginAdminUseCase extends UseCase<any, any> {
    protected inputSchema = adminLoginDtoSchema;
    protected outputSchema = adminLoginResponseSchema;

    private readonly adminRepository: IAdminRepository;
    private readonly jwtService: JwtService;

    constructor(adminRepository?: IAdminRepository) {
        super();
        this.adminRepository = adminRepository || new PrismaAdminRepository();
        this.jwtService = new JwtService();
    }

    protected async implementation(data: any): Promise<any> {
        const { email, password } = data;

        const admin = await this.adminRepository.findByEmail(email);
        if (!admin || !admin.password) {
            throw new AdminInvalidCredentialsError();
        }

        if (admin.status !== 'active') {
            throw new AdminInactiveError();
        }

        const isValidPassword = await bcrypt.compare(password, admin.password);
        if (!isValidPassword) {
            throw new AdminInvalidCredentialsError();
        }

        const token = this.jwtService.generateToken({
            email: admin.email,
            actorType: 'admin',
            adminId: admin.id,
            role: admin.role,
            status: admin.status
        });

        await this.adminRepository.updateLastLogin(admin.id);
        await this.adminRepository.logAuditAction(admin.id, 'login', 'auth');

        return {
            token,
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
