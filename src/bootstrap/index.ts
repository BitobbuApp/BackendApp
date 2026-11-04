import { BootstrapError, EXIT_PERMANENT, fetchSecrets, ProcessName } from './secrets';
import { validateConfig } from './configSchema';

/**
 * Loads secrets before any module that reads configuration is imported.
 * Prod: Infisical only (no .env). Local dev without Infisical: SECRETS_PROVIDER=env.
 * Secrets live only in this process's memory; they are never written to disk or passed through PM2.
 */
export async function loadConfig(processName: ProcessName): Promise<void> {
    try {
        let values: Record<string, string | undefined>;
        // Local/dev: let a private .env choose the provider (SECRETS_PROVIDER=env) without exporting variables.
        // No-op when there is no .env (production uses Infisical only); real environment variables win.
        if (process.env.NODE_ENV !== 'production') {
            (await import('dotenv')).config({ quiet: true });
        }
        if (process.env.SECRETS_PROVIDER === 'env' && process.env.NODE_ENV !== 'production') {
            await import('dotenv/config');
            values = { ...process.env };
        } else {
            values = { NODE_ENV: process.env.NODE_ENV, ...(await fetchSecrets(processName)) };
        }
        const config = Object.freeze(validateConfig(processName, values));
        for (const [key, value] of Object.entries(config)) {
            if (value !== undefined) process.env[key] = String(value);
        }
    } catch (error) {
        console.error(`[bootstrap:${processName}] ${error instanceof Error ? error.message : 'startup failed'}`);
        // Missing/invalid local config is permanent too; only network/5xx failures should be restarted by PM2.
        const permanent = !(error instanceof BootstrapError) || error.permanent;
        process.exit(permanent ? EXIT_PERMANENT : 1);
    }
}
