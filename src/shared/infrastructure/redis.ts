import IORedis from 'ioredis';
import logger from './logger';

export const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisConnection.on('error', (err) => {
    logger.error(err, '❌ Redis Database Error');
});

export async function connectRedis() {
    try {
        await redisConnection.ping();
        logger.info('📦 Successfully connected to Redis');
    } catch (error) {
        logger.error(error, '❌ Failed to connect to Redis');
        process.exit(1);
    }
}
