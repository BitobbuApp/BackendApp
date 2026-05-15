import { UseCase } from '../../../shared/application/useCase';
import { UserNotFoundError } from '../domain/errors/user.errors';
import { PrismaUserRepository } from '../infrastructure/persistence/PrismaUserRepository';
import { UserRepository } from '../domain/repositories/user.repository';
import bcrypt from 'bcrypt';
import Joi from 'joi';

export class ResetPasswordUseCase extends UseCase<any, void> {
    protected inputSchema = Joi.object({
        email: Joi.string().email().required(),
        newPassword: Joi.string()
            .min(8)
            .pattern(/^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]+$/)
            .message('La nueva contraseña debe tener al menos 8 caracteres, incluir letras y números, y ser solo alfanumérica.')
            .required(),
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required()
    });
    
    protected outputSchema = Joi.any();
    private readonly userRepository: UserRepository;

    constructor() {
        super();
        this.userRepository = new PrismaUserRepository();
    }

    protected async implementation(payload: any): Promise<void> {
        const { email, newPassword } = payload;

        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new UserNotFoundError(email);
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        user.password = hashedPassword;
        user.salt = saltRounds;

        await this.userRepository.update(user);
    }
}
