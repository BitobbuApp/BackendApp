import { Worker } from 'bullmq';
import { redisConnection } from '../../redis';
import logger from '../../logger';
import { ProcessAnalyticsEventUseCase } from '../../../../modules/analytics/application/processAnalyticsEvent';
import { AnalyticsEvent } from '../../../../modules/analytics/domain/analyticsEvent';

const processor = new ProcessAnalyticsEventUseCase();

export const analyticsWorker = new Worker<AnalyticsEvent>(
    'analytics',
    async (job) => {
        await processor.execute(job.data);
    },
    { connection: redisConnection, concurrency: 10 },
);

analyticsWorker.on('failed', (job, err) => {
    logger.error(`[analytics] Job ${job?.id} (${job?.name}) failed: ${err.message}`);
});

