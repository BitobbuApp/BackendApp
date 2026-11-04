import { loadConfig } from './bootstrap';

// Secrets must be loaded before any module that reads config at import time (prisma, redis, S3, JWT).
async function main() {
    await loadConfig('api');
    const { start } = await import('./server');
    await start();
}

main();
