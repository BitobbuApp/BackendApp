import { Worker } from 'bullmq';
import { redisConnection } from '../../redis';
import { SUBSCRIPTIONS_QUEUE } from './subscriptions.queue';
import { SubscriptionMaintenanceUseCase } from '../../../../modules/subscriptions/application/subscriptionMaintenanceUseCase';

export const subscriptionsWorker = new Worker(
  SUBSCRIPTIONS_QUEUE,
  async () => new SubscriptionMaintenanceUseCase().execute(),
  { connection: redisConnection, concurrency: 1 }
);

subscriptionsWorker.on('failed', (job, err) => {
  console.error(`[subscriptions] Job ${job?.id} failed: ${err.message}`);
});
