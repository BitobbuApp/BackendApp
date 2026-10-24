import { UseCase } from '../../../shared/application/useCase';
import { InvalidCredentialsError, UserNotFoundError } from '../domain/errors/user.errors';
import { PrismaUserRepository } from '../infrastructure/persistence/PrismaUserRepository';
import { UserRepository } from '../domain/repositories/user.repository';
import Joi from 'joi';
import { passwordSchema, validatePasswordContext } from '../../../shared/application/validation/password.schema';
import { PasswordHasher } from '../../../shared/application/services/passwordHasher';
import { PasswordChangeService } from '../../auth/domain/services/passwordChange.service';
import { JwtService } from '../../../shared/application/services/jwtService';
import { ApplicationError } from '../../../shared/domain/error';
import { MailgunEmailAdapter } from '../../../shared/infrastructure/notifications/mailgunEmailAdapter';
import { EmailService } from '../../../shared/application/services/email.service';
import { formatEmailDate } from '../../../shared/application/services/formatEmailDate';

interface ChangePasswordInput {
    userId: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
    ip?: string;
    userAgent?: string;
}

interface ChangePasswordOutput {
    token: string;
}

export class ChangePasswordUseCase extends UseCase<ChangePasswordInput, ChangePasswordOutput> {
    protected inputSchema = Joi.object({
        userId: Joi.string().uuid().required(),
        currentPassword: Joi.string().required(),
        newPassword: passwordSchema,
        confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
            'any.only': 'Las contraseñas no coinciden.',
        }),
        ip: Joi.string().allow('', null).optional(),
        userAgent: Joi.string().allow('', null).optional(),
    });
    
    protected outputSchema = Joi.any();
    private readonly userRepository: UserRepository;
    private readonly passwordHasher: PasswordHasher;
    private readonly passwordChangeService: PasswordChangeService;
    private readonly jwtService: JwtService;
    private readonly emailService: EmailService;

    constructor() {
        super();
        this.userRepository = new PrismaUserRepository();
        this.passwordHasher = new PasswordHasher();
        this.passwordChangeService = new PasswordChangeService(this.passwordHasher);
        this.jwtService = new JwtService();
        this.emailService = new MailgunEmailAdapter();
    }

    protected async implementation(payload: ChangePasswordInput): Promise<ChangePasswordOutput> {
        const { userId, currentPassword, newPassword, ip, userAgent } = payload;

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UserNotFoundError(userId);
        }

        // Contextual validation (avoid password matching user's first name or email handle)
        const contextCheck = validatePasswordContext(newPassword, {
            email: user.email,
            firstName: user.first_name,
        });
        if (!contextCheck.valid) {
            throw new ApplicationError(422, contextCheck.reason || 'Contraseña insegura', 'PASSWORD_POLICY_VIOLATION');
        }

        // Verify current password
        const isPasswordValid = await this.passwordHasher.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            throw new InvalidCredentialsError();
        }

        // Atomically change password, check history, prune to 5, increment token_version
        const { tokenVersion, passwordChangedAt } = await this.passwordChangeService.changePassword({
            userId,
            newPassword,
            reason: 'password_changed',
            ip,
            userAgent,
            companyId: user.company_id,
        });

        // Send confirmation email asynchronously (fail-safe)
        this.emailService.sendTemplate({
            to: user.email,
            templateKey: 'password_updated',
            variables: {
                first_name: user.first_name,
                login_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`,
                changed_at: formatEmailDate(passwordChangedAt, (user as any).timezone),
                ip: ip || 'Desconocida',
            },
        }).catch(() => null);

        // Generate updated session token with the new token_version so current session stays active
        const token = this.jwtService.generateToken({
            userId: user.id,
            companyId: user.company_id ?? null,
            email: user.email,
            tv: tokenVersion,
        });

        return { token };
    }
}
