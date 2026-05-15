import { Queue } from 'bullmq';
import { redisConnection } from '../../redis';

export const matchingQueue = new Queue('rfq-matching', {
  connection: redisConnection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 2000 } }
});
