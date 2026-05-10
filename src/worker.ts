import 'dotenv/config';
import { connectDatabase } from './shared/infrastructure/database';
import { connectRedis } from './shared/infrastructure/redis';
import './shared/infrastructure/queue/index.worker';

async function startWorker() {
    try {
        await connectDatabase();
        await connectRedis();
        console.log('[worker] BullMQ background worker started successfully 🚀');
    } catch (error) {
        console.error('[worker] Failed to start background worker:', error);
        process.exit(1);
    }
}

startWorker();
