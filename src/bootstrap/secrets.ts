import { readFileSync } from 'node:fs';
import { InfisicalSDK } from '@infisical/sdk';

export type ProcessName = 'api' | 'worker';

interface BootstrapCredentials {
    clientId: string;
    clientSecret: string;
}

// Permanent errors (bad credentials, missing path, invalid config) exit with a distinct code so PM2 does not restart-loop.
export const EXIT_PERMANENT = 78;

export class BootstrapError extends Error {
    constructor(message: string, readonly permanent: boolean) {
        super(message);
    }
}

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1000;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing bootstrap variable ${name}`);
    return value;
}

// Bootstrap credential: a file readable only by the app user (prod) or env vars (dev/staging on Render).
function readCredentials(): BootstrapCredentials {
    const file = process.env.INFISICAL_CREDENTIALS_FILE;
    if (file) {
        const parsed = JSON.parse(readFileSync(file, 'utf8'));
        if (!parsed.clientId || !parsed.clientSecret) {
            throw new Error(`Credentials file ${file} must contain clientId and clientSecret`);
        }
        return { clientId: parsed.clientId, clientSecret: parsed.clientSecret };
    }
    return {
        clientId: required('INFISICAL_CLIENT_ID'),
        clientSecret: required('INFISICAL_CLIENT_SECRET'),
    };
}

async function fetchOnce(
    processName: ProcessName,
    { clientId, clientSecret }: BootstrapCredentials,
    projectId: string,
    environment: string,
): Promise<Record<string, string>> {
    const siteUrl = process.env.INFISICAL_SITE_URL;
    const client = await new InfisicalSDK(siteUrl ? { siteUrl } : {})
        .auth()
        .universalAuth.login({ clientId, clientSecret });

    const result: Record<string, string> = {};
    // /shared first so the process folder overrides it
    for (const secretPath of ['/shared', `/${processName}`]) {
        const { secrets } = await client.secrets().listSecrets({
            environment,
            projectId,
            secretPath,
            expandSecretReferences: true,
            viewSecretValue: true,
            attachToProcessEnv: false,
        });
        for (const secret of secrets) result[secret.secretKey] = secret.secretValue;
    }
    return result;
}

export async function fetchSecrets(processName: ProcessName): Promise<Record<string, string>> {
    // Local misconfiguration is not transient: fail immediately, retry only network/API errors.
    const credentials = readCredentials();
    const projectId = required('INFISICAL_PROJECT_ID');
    const environment = required('INFISICAL_ENV');

    let lastError: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
            return await fetchOnce(processName, credentials, projectId, environment);
        } catch (error) {
            lastError = error;
            // 4xx (bad path, bad credentials, no permission) won't fix itself: don't retry.
            const status = /StatusCode=(\d{3})/.exec(error instanceof Error ? error.message : '')?.[1];
            const permanent = status !== undefined && status.startsWith('4') && status !== '429';
            if (permanent || attempt === MAX_ATTEMPTS) break;
            const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
            console.error(`[bootstrap] Infisical attempt ${attempt}/${MAX_ATTEMPTS} failed, retrying in ${delay}ms`);
            await sleep(delay);
        }
    }
    const message = lastError instanceof Error ? lastError.message : 'unknown error';
    const status = /StatusCode=(\d{3})/.exec(message)?.[1];
    throw new BootstrapError(
        `Could not load secrets from Infisical: ${message}`,
        status !== undefined && status.startsWith('4') && status !== '429',
    );
}
