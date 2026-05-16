import { UseCase } from "../../../shared/application/useCase";
import { UserRepository } from "../domain/repositories/user.repository";
import { PrismaUserRepository } from "../infrastructure/persistence/PrismaUserRepository";
import { adminUpdateUserStatusInputSchema, adminUpdateUserStatusResponseSchema } from "./dtos/admin-user.dto";
import { ApplicationError } from "../../../shared/domain/error";

export class AdminUpdateUserStatusUseCase extends UseCase<any, any> {
    protected inputSchema = adminUpdateUserStatusInputSchema;
    protected outputSchema = adminUpdateUserStatusResponseSchema;

    private readonly userRepository: UserRepository;

    constructor(userRepository?: UserRepository) {
        super();
        this.userRepository = userRepository || new PrismaUserRepository();
    }

    protected async implementation(input: { id: string, status: string, reason?: string }): Promise<any> {
        const { id, status } = input;

        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new ApplicationError(404, "User not found");
        }

        user.is_active = status === 'active';
        
        const updated = await this.userRepository.update(user);

        return {
            id: updated.id,
            status: updated.is_active ? 'active' : 'inactive'
        };
    }
}
