import fastify from 'fastify';
import cors from '@fastify/cors';
import { loadConfig } from './bootstrap';

async function startWorker() {
    try {
        // Secrets first: the modules below read config at import time.
        await loadConfig('worker');
        const { connectDatabase } = await import('./shared/infrastructure/database');
        const { connectRedis } = await import('./shared/infrastructure/redis');
        await import('./shared/infrastructure/queue/index.worker');

        const app = fastify();
        app.register(cors, {
            origin: '*',
            methods: ['GET', 'OPTIONS'],
        });

        // Health check
        app.get('/', async () => {
            return { status: 'ok' }
        });

        await connectDatabase();
        await connectRedis();
        console.log('[worker] BullMQ background worker started successfully 🚀');

        await app.listen({
            port: Number(process.env.PORT_WORKER) || 3001,
            host: '0.0.0.0'
        });
        console.log(`[worker] Health check server listening on port ${Number(process.env.PORT_WORKER) || 3001}`);
    } catch (error) {
        console.error('[worker] Failed to start background worker:', error);
        process.exit(1);
    }
}

startWorker();
