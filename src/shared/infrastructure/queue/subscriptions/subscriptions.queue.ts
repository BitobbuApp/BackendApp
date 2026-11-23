import { Queue } from 'bullmq';
import { redisConnection } from '../../redis';

export const SUBSCRIPTIONS_QUEUE = 'subscriptions';
export const DAILY_MAINTENANCE_JOB = 'daily-maintenance';

export const subscriptionsQueue = new Queue(SUBSCRIPTIONS_QUEUE, {
  connection: redisConnection,
  defaultJobOptions: { attempts: 3, backoff: { type: 'exponential', delay: 60_000 }, removeOnComplete: 30, removeOnFail: 100 }
});

/** Idempotent: re-registering the scheduler on every worker start keeps a single daily run. */
export async function scheduleSubscriptionMaintenance(timeZone: string) {
  await subscriptionsQueue.upsertJobScheduler(
    DAILY_MAINTENANCE_JOB,
    { pattern: '0 1 * * *', tz: timeZone },
    { name: DAILY_MAINTENANCE_JOB }
  );
}
