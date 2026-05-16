import 'dotenv/config';
import fastify from 'fastify';
import cors from '@fastify/cors';
import { connectDatabase } from './shared/infrastructure/database';
import { connectRedis } from './shared/infrastructure/redis';
import './shared/infrastructure/queue/index.worker';

const app = fastify();

app.register(cors, {
    origin: '*',
    methods: ['GET', 'OPTIONS'],
});

// Health check for Render
app.get('/', async () => {
    return { status: 'ok' }
});

async function startWorker() {
    try {
        await connectDatabase();
        await connectRedis();
        console.log('[worker] BullMQ background worker started successfully 🚀');

        await app.listen({
            port: Number(process.env.PORT) || 3001,
            host: '0.0.0.0'
        });
        console.log(`[worker] Health check server listening on port ${Number(process.env.PORT) || 3001}`);
    } catch (error) {
        console.error('[worker] Failed to start background worker:', error);
        process.exit(1);
    }
}

startWorker();
