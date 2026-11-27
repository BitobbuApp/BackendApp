import { Queue } from 'bullmq';
import { redisConnection } from '../../redis';

export const analyticsQueue = new Queue('analytics', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
        removeOnComplete: 500,
        removeOnFail: 200,
    },
});

