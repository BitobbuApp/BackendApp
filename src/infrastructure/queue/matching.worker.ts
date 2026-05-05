import { Worker } from 'bullmq';
import { redisConnection } from './redis.connection';
import { MatchRfqToSuppliersUseCase } from '../../modules/requests/application/matchRfqToSuppliersUseCase';

export const matchingWorker = new Worker(
  'rfq-matching',
  async (job) => {
    const useCase = new MatchRfqToSuppliersUseCase();
    await useCase.execute({ rfqId: job.data.rfqId });
  },
  { connection: redisConnection, concurrency: 5 }
);

matchingWorker.on('failed', (job, err) => {
  console.error(`[matching] Job ${job?.id} failed: ${err.message}`);
});
