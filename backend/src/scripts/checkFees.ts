import { createPublicClient, http, formatEther, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import dotenv from 'dotenv';
import logger from '../utils/logger';

dotenv.config();

const RPC_URL = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';
// Usamos la wallet que apareció en los logs del usuario como wallet del sistema
const FEE_WALLET = '0x0C1ee65e59Cd82C1C6FF3bc0d5E612190F45264D'; 

// Tokens en Sepolia
const TOKENS = {
  WETH: { address: '0x0fe44892c3279c09654f3590cf6CedAc3FC3ccdc', decimals: 18 },
  WBTC: { address: '0x8762c93f84dcB6f9782602D842a587409b7Cf6cd', decimals: 8 },
  USDC: { address: '0xd28824F4515fA0FeDD052eA70369EA6175a4e18b', decimals: 6 },
};

const client = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

async function checkFees() {
  logger.info(`Checking fee wallet balance: ${FEE_WALLET}`, { service: 'CheckFees' });

  try {
    // ETH Balance (Native)
    const ethBalance = await client.getBalance({ address: FEE_WALLET as `0x${string}` });
    logger.info(`ETH Balance: ${formatEther(ethBalance)} ETH`, { service: 'CheckFees' });

    // Token Balances
    for (const [symbol, token] of Object.entries(TOKENS)) {
      try {
        const balance = await client.readContract({
          address: token.address as `0x${string}`,
          abi: [{ 
            name: 'balanceOf', 
            type: 'function', 
            stateMutability: 'view',
            inputs: [{ name: 'account', type: 'address' }], 
            outputs: [{ type: 'uint256' }] 
          }],
          functionName: 'balanceOf',
          args: [FEE_WALLET as `0x${string}`],
        }) as bigint;

        logger.info(`${symbol} Balance: ${formatUnits(balance, token.decimals)} ${symbol}`, { service: 'CheckFees' });
      } catch (err) {
        logger.warn(`Could not fetch ${symbol} balance`, { service: 'CheckFees' });
      }
    }

  } catch (error: any) {
    logger.error(`Error checking fees: ${error.message}`, { service: 'CheckFees' });
  }
}

checkFees();
