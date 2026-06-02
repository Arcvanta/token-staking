import logger from '../utils/logger';
import { isDatabaseConnected } from '../config/database';
import { isRedisAvailable } from '../config/redis';
import { scheduleUpdateOptions, isApiValidated } from '../queues/updateOptionsQueue';
import { startTransactionWorker } from '../workers/transactionWorker';
import { startContractListener } from '../listeners/contractListener';

export async function initializeBackgroundServices(): Promise<void> {
  const redisReady = await isRedisAvailable();
  const dbReady = isDatabaseConnected();
  const apiReady = await isApiValidated();

  if (!redisReady) {
    logger.warn(
      'Redis unavailable. Skipping queues, workers, and contract listener. Start Redis or set REDIS_URL to enable them.',
      { service: 'System' }
    );
    return;
  }

  if (!dbReady) {
    logger.warn(
      'MongoDB unavailable. Skipping background jobs that require the database.',
      { service: 'System' }
    );
    return;
  }

  try {
    startTransactionWorker();
    await scheduleUpdateOptions();
    startContractListener();
    logger.success('Queue system and listeners initialized', { service: 'System' });
  } catch (error: any) {
    logger.warn(`Failed to initialize background services: ${error.message}`, {
      service: 'System',
    });
  }
}
