import { PrismaUserRepository } from '../infrastructure/persistence/PrismaUserRepository';
import { UserRepository } from '../domain/repositories/user.repository';
import { InvalidCredentialsError } from '../domain/errors/user.errors';
import { UseCase } from '../../../shared/application/useCase';
import { loginUserDtoRequestSchema, loginUserDtoResponseSchema } from './dtos/login.dto';
import Joi from 'joi';
import { JwtService } from '../../../shared/application/services/jwtService';
import { PasswordHasher } from '../../../shared/application/services/passwordHasher';
import { RateLimiter } from '../../../shared/application/services/rateLimiter';
import { TooManyRequestsError } from '../../auth/domain/errors/auth.errors';
import crypto from 'crypto';
import { prisma } from '../../../shared/infrastructure/database';

const LOGIN_MAX_PER_EMAIL_AND_IP = 5;
const LOGIN_MAX_PER_IP = 30;
const LOGIN_WINDOW_SECONDS = 15 * 60;

// Pre-computed cost 12 bcrypt hash to equalize response times when user doesn't exist (timing-attack mitigation)
const DUMMY_TIMING_HASH = '$2b$12$coP.XnGORYlpUkkrFF2LqeyTl97mirjvCzMEheOrLeBSZPTV1QSNO';

interface LoginDto {
    email: string;
    password: string;
    ip?: string | undefined;
}

interface LoginResult {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    is_active: boolean;
    last_access: Date;
    token: string;
    has_company: boolean;
    company_id: string | null;
}

export class LoginUserUseCase extends UseCase<LoginDto, LoginResult> {
    protected inputSchema: Joi.Schema = loginUserDtoRequestSchema;
    protected outputSchema: Joi.Schema = loginUserDtoResponseSchema;
    private readonly userRepository: UserRepository;
    private readonly jwtService: JwtService;
    private readonly passwordHasher: PasswordHasher;

    constructor() {
        super();
        this.userRepository = new PrismaUserRepository();
        this.jwtService = new JwtService();
        this.passwordHasher = new PasswordHasher();
    }

    protected async implementation(dto: LoginDto): Promise<LoginResult> {
        // 0. Brute-force limits: per (email, IP) so nobody can lock another person's account from elsewhere, plus per IP
        const emailHash = crypto.createHash('sha256').update(dto.email.trim().toLowerCase()).digest('hex');
        const comboKey = `rl:login:${emailHash}:${dto.ip ?? 'unknown'}`;
        const ipKey = `rl:login:ip:${dto.ip ?? 'unknown'}`;
        const [comboLimit, ipLimit] = await Promise.all([
            RateLimiter.check(comboKey, LOGIN_MAX_PER_EMAIL_AND_IP),
            RateLimiter.check(ipKey, LOGIN_MAX_PER_IP),
        ]);
        if (!comboLimit.allowed || !ipLimit.allowed) {
            throw new TooManyRequestsError('Demasiados intentos de inicio de sesión. Espera unos minutos e inténtalo de nuevo.');
        }
        const registerFailure = () => Promise.all([
            RateLimiter.consume({ key: comboKey, maxAttempts: LOGIN_MAX_PER_EMAIL_AND_IP, windowSeconds: LOGIN_WINDOW_SECONDS }),
            RateLimiter.consume({ key: ipKey, maxAttempts: LOGIN_MAX_PER_IP, windowSeconds: LOGIN_WINDOW_SECONDS }),
        ]);

        // 1. Find the user by email
        const user = await this.userRepository.findByEmail(dto.email);
        if (!user) {
            // Constant-time defense against email enumeration
            await this.passwordHasher.compare(dto.password, DUMMY_TIMING_HASH);
            await registerFailure();
            throw new InvalidCredentialsError();
        }

        // 2. Verify the account is active
        if (user.is_active === false) {
            await this.passwordHasher.compare(dto.password, DUMMY_TIMING_HASH);
            await registerFailure();
            throw new InvalidCredentialsError(); // Don't reveal if account is deactivated
        }

        // 3. Compare the provided password against the stored hash
        const isPasswordValid = await this.passwordHasher.compare(dto.password, user.password);
        if (!isPasswordValid) {
            await registerFailure();
            throw new InvalidCredentialsError();
        }
        await RateLimiter.reset(comboKey);

        // 4. Check if 2FA is active or required by company policy
        const userSecurity = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                two_factor: true,
                company: { include: { settings: true } },
            },
        });

        if (userSecurity?.two_factor?.enabled_at) {
            const mfaToken = this.jwtService.generateStepToken(
                { userId: user.id, email: user.email, purpose: 'mfa' },
                '5m'
            );
            return {
                mfa_required: true,
                mfa_token: mfaToken,
            } as any;
        }

        if (userSecurity?.company?.settings?.two_factor_required && !userSecurity.two_factor?.enabled_at) {
            const enrollmentToken = this.jwtService.generateStepToken(
                { userId: user.id, email: user.email, purpose: 'mfa_enroll' },
                '15m'
            );
            return {
                two_factor_enrollment_required: true,
                enrollment_token: enrollmentToken,
            } as any;
        }

        // 4. Update last_access timestamp
        const updatedUser = await this.userRepository.update({
            ...user,
            last_access: new Date(),
        });

        // 5. Generate a real JWT
        const token = this.jwtService.generateToken({
            userId: user.id,
            companyId: user?.company_id ?? null,
            email: user.email,
            tv: user.token_version,
        });

        return {
            id: updatedUser.id,
            first_name: updatedUser.first_name,
            last_name: updatedUser.last_name,
            email: updatedUser.email,
            is_active: updatedUser.is_active ?? true,
            last_access: updatedUser.last_access!,
            token,
            has_company: !!updatedUser.company_id,
            company_id: updatedUser.company_id,
        };
    }
}
