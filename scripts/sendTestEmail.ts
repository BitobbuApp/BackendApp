// Sends one real email through the production adapter to check a Mailgun template (subject, button, variables).
// Usage: npx tsx scripts/sendTestEmail.ts <to> [password_reset|password_updated|two_factor_changed]
import 'dotenv/config';
import { MailgunEmailAdapter } from '../src/shared/infrastructure/notifications/mailgunEmailAdapter';

const [to, key = 'password_reset'] = process.argv.slice(2);
if (!to) {
    console.error('Usage: npx tsx scripts/sendTestEmail.ts <to> [password_reset|password_updated|two_factor_changed]');
    process.exit(1);
}

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const variablesByKey: Record<string, Record<string, string | number>> = {
    password_reset: {
        first_name: 'Ana',
        reset_url: `${frontendUrl}/reset-password?token=PRUEBA-NO-VALIDO`,
        expires_in_minutes: Number(process.env.PASSWORD_RESET_TTL_MINUTES) || 20,
        requested_at: new Date().toISOString(),
        ip: '127.0.0.1',
    },
    password_updated: { first_name: 'Ana', login_url: `${frontendUrl}/login`, changed_at: new Date().toISOString(), ip: '127.0.0.1' },
    two_factor_changed: { first_name: 'Ana', action: 'activado', changed_at: new Date().toISOString(), ip: '127.0.0.1' },
};

new MailgunEmailAdapter()
    .sendTemplate({ to, templateKey: key, variables: variablesByKey[key] ?? { first_name: 'Ana' }, critical: true })
    .then(() => console.log(`Sent "${key}" to ${to}. Check the inbox: subject, button link and variables.`))
    .catch((error) => { console.error('Send failed:', error?.message ?? error); process.exit(1); });
