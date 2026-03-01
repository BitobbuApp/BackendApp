import { UserRepository } from '../domain/userRepository';
import { InvalidCredentialsError, UserNotFoundError } from '../domain/userErrors';
import bcrypt from 'bcrypt';

interface LoginDto {
    email: string;
    password: string;
}

interface LoginResult {
    user: {
        id: string;
        first_name: string;
        last_name: string;
        email: string;
        is_active: boolean | null;
        last_access: Date | null;
    };
    token: string; // JWT placeholder — replace with real JWT generation later
}

export class LoginUserUseCase {
    constructor(private readonly userRepository: UserRepository) { }

    async execute(dto: LoginDto): Promise<LoginResult> {
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
        await this.userRepository.update({
            ...user,
            last_access: new Date(),
        });

        // 5. TODO: Replace this with a real JWT generated from a JwtService
        const token = `token-placeholder-for-${user.id}`;

        return {
            user: {
                id: user.id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                is_active: user.is_active,
                last_access: user.last_access,
            },
            token,
        };
    }
}
