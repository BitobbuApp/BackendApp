import { UseCase } from "../../../shared/application/useCase";
import { PrismaUserRepository } from '../infrastructure/persistence/PrismaUserRepository';
import { updateUserDtoRequestSchema, updateUserDtoResponseSchema } from "./dtos/user.dto";
import Joi from "joi";
import { UserNotFoundError } from "../domain/errors/user.errors";

interface UpdateUserInput {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    company_id?: string | null;
}

interface UpdateUserOutput {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    company_id: string | null;
    created_at: Date;
    updated_at: Date | null;
}

export class UpdateUserUseCase extends UseCase<UpdateUserInput, UpdateUserOutput> {
    protected inputSchema: Joi.Schema = updateUserDtoRequestSchema.append({
        id: Joi.string().uuid().required()
    });
    protected outputSchema: Joi.Schema = updateUserDtoResponseSchema;
    private readonly userRepository: PrismaUserRepository;

    constructor() {
        super();
        this.userRepository = new PrismaUserRepository();
    }

    protected async implementation(data: UpdateUserInput): Promise<UpdateUserOutput> {
        const user = await this.userRepository.findById(data.id);
        if (!user) {
            throw new UserNotFoundError(data.id);
        }

        if (data.first_name) user.first_name = data.first_name;
        if (data.last_name) user.last_name = data.last_name;
        if (data.email) user.email = data.email;
        if (data.company_id !== undefined) user.company_id = data.company_id;

        const updated = await this.userRepository.update(user);

        return {
            id: updated.id,
            first_name: updated.first_name,
            last_name: updated.last_name,
            email: updated.email,
            company_id: updated.company_id,
            created_at: updated.created_at!,
            updated_at: updated.updated_at
        };
    }
}
