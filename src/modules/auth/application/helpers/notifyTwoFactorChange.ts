import { EmailService } from '../../../../shared/application/services/email.service';
import { formatEmailDate } from '../../../../shared/application/services/formatEmailDate';

export type TwoFactorChangeAction = 'activado' | 'desactivado' | 'códigos de respaldo regenerados';

/** Tells the user that the security of their account changed. Fire-and-forget: never blocks the action. */
export function notifyTwoFactorChange(
    emailService: EmailService,
    user: { email: string; first_name: string; timezone?: string | null },
    action: TwoFactorChangeAction,
    ip?: string | undefined,
): void {
    emailService.sendTemplate({
        to: user.email,
        templateKey: 'two_factor_changed',
        variables: {
            first_name: user.first_name,
            action,
            changed_at: formatEmailDate(new Date(), user.timezone),
            ip: ip || 'Desconocida',
        },
    }).catch(() => null);
}
