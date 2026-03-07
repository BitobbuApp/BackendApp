import { UserRepository } from '../domain/repositories/user.repository';
import { InvalidCredentialsError, UserNotFoundError } from '../domain/errors/user.errors';
import bcrypt from 'bcrypt';
import { UseCase } from '../../../shared/application/useCase';
import { loginUserDtoRequestSchema, loginUserDtoResponseSchema } from './dtos/login.dto';
import Joi from 'joi';
import { JwtService } from '../../../shared/application/services/jwtService';

interface LoginDto {
    email: string;
    password: string;
}

interface LoginResult {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    last_access: Date;
    token: string;
}

export class LoginUserUseCase extends UseCase<LoginDto, LoginResult> {
    protected inputSchema: Joi.Schema = loginUserDtoRequestSchema;
    protected outputSchema: Joi.Schema = loginUserDtoResponseSchema;
    private readonly jwtService: JwtService;

    constructor(private readonly userRepository: UserRepository) {
        super();
        this.jwtService = new JwtService();
    }

    protected async implementation(dto: LoginDto): Promise<LoginResult> {
        // 1. Find the user by email
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) throw new UserNotFoundError(dto.email);

        // 2. Verify the account is active
        if (user.is_active === false) {
            throw new InvalidCredentialsError(); // Don't reveal if account is deactivated
        }

        // 3. Compare the provided password against the stored hash
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) throw new InvalidCredentialsError();

        // 4. Update last_access timestamp
        const updatedUser = await this.userRepository.update({
            ...user,
            last_access: new Date(),
        });

        // 5. Generate a real JWT
        const token = this.jwtService.generateToken({
            userId: user.id,
            email: user.email
        });

        return {
            id: updatedUser.id,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            email: updatedUser.email,
            is_active: updatedUser.is_active ?? true,
            last_access: updatedUser.last_access!,
            token,
        };
    }
}
