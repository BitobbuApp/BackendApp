import { Worker } from 'bullmq';
import { redisConnection } from '../../redis';
import { SendRfqMatchEmailUseCase } from '../../../../modules/notifications/application/sendRfqMatchEmailUseCase';
import logger from '../../logger';

export const notificationsWorker = new Worker(
  'notifications',
  async (job) => {
    switch (job.name) {
      case 'rfq-match-email': {
        const useCase = new SendRfqMatchEmailUseCase();
        await useCase.execute({
          companyId: job.data.companyId,
          requestId: job.data.requestId
        });
        break;
      }
      default:
        logger.warn(`Unknown job name in notifications queue: ${job.name}`);
    }
  },
  { connection: redisConnection, concurrency: 10 }
);

notificationsWorker.on('failed', (job, err) => {
  logger.error(`[notifications] Job ${job?.id} (${job?.name}) failed: ${err.message}`);
});
