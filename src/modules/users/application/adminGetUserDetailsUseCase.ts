import { UseCase } from "../../../shared/application/useCase";
import { UserRepository } from "../domain/repositories/user.repository";
import { PrismaUserRepository } from "../infrastructure/persistence/PrismaUserRepository";
import Joi from 'joi';
import { ApplicationError } from "../../../shared/domain/error";

export class AdminGetUserDetailsUseCase extends UseCase<any, any> {
    protected inputSchema = Joi.string().uuid().required();
    protected outputSchema = Joi.any(); // We can detail this later if needed

    private readonly userRepository: UserRepository;

    constructor(userRepository?: UserRepository) {
        super();
        this.userRepository = userRepository || new PrismaUserRepository();
    }

    protected async implementation(id: string): Promise<any> {
        const userDetails = await this.userRepository.findByIdAdmin(id);
        if (!userDetails) {
            throw new ApplicationError(404, "User not found");
        }
        return userDetails;
    }
}
