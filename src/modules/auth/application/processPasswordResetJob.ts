import { prisma } from '../../../shared/infrastructure/database';
import { TokenGenerator } from '../../../shared/application/services/tokenGenerator';
import { MailgunEmailAdapter } from '../../../shared/infrastructure/notifications/mailgunEmailAdapter';
import { EmailService } from '../../../shared/application/services/email.service';
import logger from '../../../shared/infrastructure/logger';
import { formatEmailDate } from '../../../shared/application/services/formatEmailDate';

export interface ProcessPasswordResetJobData {
    email: string;
    ip?: string | null;
    userAgent?: string | null;
}

export class ProcessPasswordResetJob {
    private readonly emailService: EmailService;

    constructor(emailService?: EmailService) {
        this.emailService = emailService || new MailgunEmailAdapter();
    }

    async execute(data: ProcessPasswordResetJobData): Promise<void> {
        const { email, ip, userAgent } = data;
        const normalizedEmail = email.trim().toLowerCase();

        // 1. Find user in database
        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail },
            include: { company: true },
        });

        // If user doesn't exist or is inactive, silently log event and exit
        if (!user || user.is_active === false) {
            await prisma.securityEvent.create({
                data: {
                    user_id: null,
                    company_id: null,
                    event_type: 'password_reset_requested',
                    ip: ip ?? null,
                    user_agent: userAgent ?? null,
                    metadata: { attempted_email: normalizedEmail },
                },
            }).catch(() => null);

            logger.info({ email: normalizedEmail }, 'Password reset requested for nonexistent or deactivated account — ignored silently');
            return;
        }

        const now = new Date();
        const ttlMinutes = Number(process.env.PASSWORD_RESET_TTL_MINUTES) || 20;
        const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

        // 2. Invalidate previous open reset tokens for this user
        await prisma.passwordResetToken.updateMany({
            where: {
                user_id: user.id,
                used_at: null,
                invalidated_at: null,
            },
            data: {
                invalidated_at: now,
            },
        });

        // 3. Generate secure token
        const { token, tokenHash } = TokenGenerator.generateOpaqueToken();

        // 4. Save token in database
        await prisma.passwordResetToken.create({
            data: {
                user_id: user.id,
                token_hash: tokenHash,
                expires_at: expiresAt,
                requested_ip: ip ?? null,
                requested_ua: userAgent ?? null,
                created_at: now,
            },
        });

        // 5. Send email via Mailgun template
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

        await this.emailService.sendTemplate({
            to: user.email,
            templateKey: 'password_reset',
            critical: true,
            variables: {
                first_name: user.first_name,
                reset_url: resetUrl,
                expires_in_minutes: ttlMinutes,
                requested_at: formatEmailDate(now, user.timezone),
                ip: ip || 'Desconocida',
            },
        });

        // 6. Log security audit event
        await prisma.securityEvent.create({
            data: {
                user_id: user.id,
                company_id: user.company_id ?? null,
                event_type: 'password_reset_requested',
                ip: ip ?? null,
                user_agent: userAgent ?? null,
            },
        }).catch(() => null);

        logger.info({ userId: user.id, email: user.email }, 'Password reset email sent successfully');
    }
}
