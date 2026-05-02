import { UseCase } from "../../../shared/application/useCase";
import { UserRepository } from "../domain/repositories/user.repository";
import { PrismaUserRepository } from "../infrastructure/persistence/PrismaUserRepository";
import { ApplicationError } from "../../../shared/domain/error";
import Joi from 'joi';

interface GetUserByIdEmailInput {
    userId: string;
    email: string;
}

/**
 * Used by the auth middleware to validate that the token payload
 * actually matches a real, active user in the database.
 * Verifies both userId AND email to prevent token reuse after account changes.
 */
export class GetUserByIdEmailUseCase extends UseCase<GetUserByIdEmailInput, any> {
    protected inputSchema: Joi.Schema = Joi.object({
        userId: Joi.string().uuid().required(),
        email: Joi.string().email().required(),
    });

    protected outputSchema: Joi.Schema = Joi.any();

    private readonly userRepository: UserRepository;

    constructor(userRepository?: UserRepository) {
        super();
        this.userRepository = userRepository || new PrismaUserRepository();
    }

    protected async implementation({ userId, email }: GetUserByIdEmailInput): Promise<any> {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new ApplicationError(401, "User not found");
        }

        if (user.email !== email) {
            throw new ApplicationError(401, "Token payload mismatch");
        }

        if (!user.is_active) {
            throw new ApplicationError(401, "User account is inactive");
        }

        return {
            userId: user.id,
            companyId: user.company_id ?? null,
            email: user.email,
            is_active: user.is_active,
        };
    }
}
