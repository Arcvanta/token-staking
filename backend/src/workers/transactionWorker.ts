import { Worker, Job } from 'bullmq';
import StakingTransaction from '../models/StakingTransaction';
import logger from '../utils/logger';
import { bullMQConnection } from '../config/redis';
import { env } from '../config/env';

interface StakeEventData {
  txHash: string;
  userAddress: string;
  protocol: string;
  token: string;
  tokenAddress: string;
  adapterAddress: string;
  amount: string;
  blockNumber: number;
  fee?: string;
}

interface UnstakeEventData {
  txHash: string;
  userAddress: string;
  protocol: string;
  token: string;
  amount: string;
  blockNumber: number;
}

const ADAPTER_TO_PROTOCOL: Record<string, string> = {
  [env('ADAPTER_UNISWAP', '').toLowerCase()]: 'Uniswap V3',
  [env('SEPOLIA_UNISWAP_ADAPTER', '').toLowerCase()]: 'Uniswap V3',
  [env('ADAPTER_AAVE', '').toLowerCase()]: 'Aave V3',
  [env('SEPOLIA_AAVE_ADAPTER', '').toLowerCase()]: 'Aave V3',
  [env('ADAPTER_LIDO', '').toLowerCase()]: 'Lido',
  [env('SEPOLIA_LIDO_ADAPTER', '').toLowerCase()]: 'Lido',
};

let transactionWorkerInstance: Worker | null = null;

export function startTransactionWorker(): Worker {
  if (transactionWorkerInstance) {
    return transactionWorkerInstance;
  }

  transactionWorkerInstance = new Worker<StakeEventData | UnstakeEventData>(
    'transaction-processing',
    async (job: Job<StakeEventData | UnstakeEventData>) => {
      const { txHash, userAddress, token, amount } = job.data;
      const jobName = job.name;

      logger.info(`Processing ${jobName} event for tx: ${txHash}`, { service: 'TransactionWorker' });

      try {
        if (jobName === 'process-stake') {
          const stakeData = job.data as StakeEventData;
          const { tokenAddress, adapterAddress, fee } = stakeData;
          const protocol = ADAPTER_TO_PROTOCOL[adapterAddress.toLowerCase()] || 'Unknown';

          let transaction = await StakingTransaction.findOne({ txHash });

          if (transaction) {
            if (transaction.status !== 'confirmed') {
              transaction.status = 'confirmed';
              await transaction.save();
            }
          } else {
            transaction = new StakingTransaction({
              userAddress: userAddress.toLowerCase(),
              protocol,
              token,
              tokenAddress,
              adapterAddress,
              amount,
              txHash,
              status: 'confirmed',
              fee: fee || '0',
              network: env('ACTIVE_NETWORK', 'sepolia'),
              timestamp: new Date(),
            });

            await transaction.save();
          }
        } else if (jobName === 'process-unstake') {
          const transaction = await StakingTransaction.findOne({
            userAddress: userAddress.toLowerCase(),
            token,
            status: 'confirmed',
          }).sort({ timestamp: -1 });

          if (transaction) {
            transaction.status = 'unstaked';
            transaction.unstakeTxHash = txHash;
            transaction.unstakedAt = new Date();
            await transaction.save();
          }
        }

        return { processed: true, txHash, jobName };
      } catch (error: any) {
        logger.error(`Error processing transaction ${txHash}: ${error.message}`, {
          service: 'TransactionWorker',
        });
        throw error;
      }
    },
    { connection: bullMQConnection }
  );

  transactionWorkerInstance.on('completed', (job) => {
    logger.info(`Job ${job.id} completed`, { service: 'TransactionWorker' });
  });

  transactionWorkerInstance.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`, { service: 'TransactionWorker' });
  });

  transactionWorkerInstance.on('error', (error) => {
    logger.warn(`Worker error: ${error.message}`, { service: 'TransactionWorker' });
  });

  return transactionWorkerInstance;
}
