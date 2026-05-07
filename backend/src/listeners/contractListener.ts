import { createPublicClient, http, parseAbiItem, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { getTransactionQueue } from '../queues/transactionQueue';
import logger from '../utils/logger';

const STAKING_ROUTER_ADDRESS = (process.env.STAKING_ROUTER_ADDRESS || '0xd965b8FA53a1b33B19079b9e998F4A928354B826') as `0x${string}`;
const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

const client = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

// Mapeo de direcciones a símbolos y decimales (debería coincidir con el frontend/env)
const TOKENS: Record<string, { symbol: string; decimals: number }> = {
  '0x0fe44892c3279c09654f3590cf6CedAc3FC3ccdc': { symbol: 'WETH', decimals: 18 },
  '0x8762c93f84dcB6f9782602D842a587409b7Cf6cd': { symbol: 'WBTC', decimals: 8 },
  '0xd28824F4515fA0FeDD052eA70369EA6175a4e18b': { symbol: 'USDC', decimals: 6 },
};

// Helper to watch events with auto-reconnection
function watchEventWithRetry(eventName: string, eventAbi: any, handler: (logs: any[]) => void) {
  const startWatching = () => {
    try {
      logger.info(`Starting ${eventName} listener...`, { service: 'ContractListener' });
      
      return client.watchEvent({
        address: STAKING_ROUTER_ADDRESS,
        event: eventAbi,
        onLogs: handler,
        onError: error => {
          logger.error(`${eventName} listener error: ${error.message}`, { service: 'ContractListener' });
          // Retry after 5 seconds
          setTimeout(() => {
            logger.info(`Restarting ${eventName} listener...`, { service: 'ContractListener' });
            startWatching();
          }, 5000);
        }
      });
    } catch (error: any) {
      logger.error(`Failed to start ${eventName} listener: ${error.message}`, { service: 'ContractListener' });
      // Retry after 5 seconds
      setTimeout(() => {
        logger.info(`Retrying start of ${eventName} listener...`, { service: 'ContractListener' });
        startWatching();
      }, 5000);
    }
  };
  
  return startWatching();
}

export function startContractListener() {
  logger.info(`Starting contract listener for ${STAKING_ROUTER_ADDRESS}`, { service: 'ContractListener' });

  // Staked Event Handler
  const handleStakedLogs = (logs: any[]) => {
    logs.forEach(async log => {
      const { user, token, amount, adapter, fee } = log.args;
      const txHash = log.transactionHash;
      
      logger.info(`New Staked event detected: ${txHash}`, { service: 'ContractListener' });

      if (!token || !amount || !user) return;

      const tokenLower = token.toLowerCase();
      const tokenEntry = Object.entries(TOKENS).find(([addr]) => addr.toLowerCase() === tokenLower);
      
      let tokenSymbol = 'UNKNOWN';
      let formattedAmount = '0';
      let formattedFee = '0';

      if (tokenEntry) {
        tokenSymbol = tokenEntry[1].symbol;
        formattedAmount = formatUnits(amount, tokenEntry[1].decimals);
        formattedFee = formatUnits(fee || BigInt(0), tokenEntry[1].decimals);
      } else {
        formattedAmount = formatUnits(amount, 18);
        formattedFee = formatUnits(fee || BigInt(0), 18);
      }

      await getTransactionQueue().add('process-stake', {
        txHash,
        userAddress: user,
        protocol: 'Unknown', // Will be determined by adapter address in worker
        token: tokenSymbol,
        tokenAddress: token, // Contract address from event
        adapterAddress: adapter, // Adapter address from event
        amount: formattedAmount,
        fee: formattedFee,
        blockNumber: Number(log.blockNumber),
      });
      
      logger.info(`Stake job added to queue for tx: ${txHash}`, { service: 'ContractListener' });
    });
  };

  // Unstaked Event Handler
  const handleUnstakedLogs = (logs: any[]) => {
    logs.forEach(async log => {
      const { user, token, amount, adapter } = log.args;
      const txHash = log.transactionHash;
      
      logger.info(`New Unstaked event detected: ${txHash}`, { service: 'ContractListener' });

      if (!token || !amount || !user) return;

      const tokenLower = token.toLowerCase();
      const tokenEntry = Object.entries(TOKENS).find(([addr]) => addr.toLowerCase() === tokenLower);
      
      let tokenSymbol = 'UNKNOWN';
      let formattedAmount = '0';

      if (tokenEntry) {
        tokenSymbol = tokenEntry[1].symbol;
        formattedAmount = formatUnits(amount, tokenEntry[1].decimals);
      } else {
        formattedAmount = formatUnits(amount, 18);
      }

      await getTransactionQueue().add('process-unstake', {
        txHash,
        userAddress: user,
        protocol: 'Unknown',
        token: tokenSymbol,
        amount: formattedAmount,
        blockNumber: Number(log.blockNumber),
      });
      
      logger.info(`Unstake job added to queue for tx: ${txHash}`, { service: 'ContractListener' });
    });
  };

  // Start listeners
  watchEventWithRetry(
    'Staked', 
    parseAbiItem('event Staked(address indexed user, address indexed token, uint256 amount, address indexed adapter, uint256 fee)'),
    handleStakedLogs
  );

  watchEventWithRetry(
    'Unstaked',
    parseAbiItem('event Unstaked(address indexed user, address indexed token, uint256 amount, address indexed adapter)'),
    handleUnstakedLogs
  );
  
  logger.success('Contract listeners initialized', { service: 'ContractListener' });
}
