import Joi from 'joi';
import { UserRepository } from '../domain/repositories/user.repository';
import { PrismaUserRepository } from "../infrastructure/persistence/PrismaUserRepository";
import { UserAlreadyExistsError } from '../domain/errors/user.errors';
import bcrypt from 'bcrypt';
import { UseCase } from '../../../shared/application/useCase';
import { registerUserDtoRequestSchema, registerUserDtoResponseSchema } from './dtos/register.dto';
import { VENEZUELA_COUNTRY_ID } from '../../../shared/constants/geo.constants';
import { EmailService } from '../../../shared/application/services/email.service';
import { NodemailerBrevoEmailService } from '../../../shared/infrastructure/notifications/nodemailerBrevoEmailService';

interface RegisterDto {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    trade_name: string;
    country_id: number;
    state_id: number;
    sector_id: number;
    can_buy?: boolean;
    can_sell?: boolean;
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
    private readonly userRepository: UserRepository;
    private readonly emailService: EmailService;

    constructor() {
        super();
        this.userRepository = new PrismaUserRepository();
        this.emailService = new NodemailerBrevoEmailService();
    }

    protected async implementation(userDto: RegisterDto): Promise<RegisterResult> {
        const { password, ...userData } = userDto;

        // Enforce Venezuela as the platform country.
        // If the client sends a different country_id, override it silently.
        if (userData.country_id !== VENEZUELA_COUNTRY_ID) {
            userData.country_id = VENEZUELA_COUNTRY_ID;
        }

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

        // Send welcome email (fire and forget / fail-safe)
        await this.emailService.sendTemplate({
            to: newUser.email,
            templateKey: 'welcome',
            variables: {
                first_name: newUser.first_name,
                last_name: newUser.last_name
            }
        });

        return {
            id: newUser.id,
            first_name: newUser.first_name,
            last_name: newUser.last_name,
            email: newUser.email
        };
    }
}