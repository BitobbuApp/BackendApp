import { UserRepository } from '../domain/repositories/user.repository';
import { UserAlreadyExistsError } from '../domain/errors/user.errors';
import bcrypt from 'bcrypt';
import { UseCase } from '../../../shared/application/useCase';
import { registerUserDtoRequestSchema, registerUserDtoResponseSchema } from './dtos/register.dto';
import Joi from 'joi';

interface RegisterDto {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
}

interface RegisterResult {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
}

export class RegisterUserUseCase extends UseCase<RegisterDto, RegisterResult> {
    protected inputSchema: Joi.Schema = registerUserDtoRequestSchema;
    protected outputSchema: Joi.Schema = registerUserDtoResponseSchema;

    constructor(private readonly userRepository: UserRepository) {
        super();
    }

    protected async implementation(userDto: RegisterDto): Promise<RegisterResult> {
        const { password, ...userData } = userDto;
        if (userData.email) {
            const userExist = await this.userRepository.findByEmail(userData.email);
            if (userExist) throw new UserAlreadyExistsError(userData.email);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await this.userRepository.create({
            id: '',
            company_id: null,
            ...userData,
            password: hashedPassword,
            salt: null,
            is_active: true,
            created_at: new Date(),
            updated_at: new Date(),
            last_access: null
        } as any);

        return {
            id: newUser.id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            email: newUser.email
        };
    }
}