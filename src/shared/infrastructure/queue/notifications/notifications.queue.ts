import { Queue } from 'bullmq';
import { redisConnection } from '../../redis';

export const notificationsQueue = new Queue('notifications', {
  connection: redisConnection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
});
