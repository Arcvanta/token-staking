import { Queue } from 'bullmq';
import { bullMQConnection } from '../config/redis';

let transactionQueueInstance: Queue | null = null;

export function getTransactionQueue(): Queue {
  if (!transactionQueueInstance) {
    transactionQueueInstance = new Queue('transaction-processing', {
      connection: bullMQConnection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: true,
      },
    });
  }

  return transactionQueueInstance;
}

export default getTransactionQueue;
