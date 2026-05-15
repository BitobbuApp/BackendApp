import { UseCase } from "../../../shared/application/useCase";
import { UserRepository } from "../domain/repositories/user.repository";
import { PrismaUserRepository } from "../infrastructure/persistence/PrismaUserRepository";
import { adminListUsersInputSchema, adminListUsersResponseSchema } from "./dtos/admin-user.dto";

export class AdminListUsersUseCase extends UseCase<any, any> {
    protected inputSchema = adminListUsersInputSchema;
    protected outputSchema = adminListUsersResponseSchema;

    private readonly userRepository: UserRepository;

    constructor(userRepository?: UserRepository) {
        super();
        this.userRepository = userRepository || new PrismaUserRepository();
    }

    protected async implementation(input: any): Promise<any> {
        const { page, limit, ...filters } = input;
        
        const { items, total } = await this.userRepository.findAllAdmin({
            page,
            limit,
            ...filters
        });

        return {
            items,
            page,
            limit,
            total,
            total_pages: Math.ceil(total / limit)
        };
    }
}
