import mongoose from 'mongoose';
import ProtocolOption from '../models/ProtocolOption';
import logger from '../utils/logger';
import { env } from './env';

let isConnected = false;

const DEFAULT_OPTIONS = [
  {
    id: 'uniswap-weth-sepolia',
    protocol: 'Uniswap V3',
    token: 'WETH',
    apy: 5.2,
    tvl: '$1.2B',
    risk: 'Medium',
    adapterAddress: '0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178',
    isActive: true,
    network: 'sepolia',
  },
  {
    id: 'lido-weth-sepolia',
    protocol: 'Lido',
    token: 'WETH',
    apy: 3.8,
    tvl: '$15B',
    risk: 'Low',
    adapterAddress: '0x1D42Ad1bdb32bEb309F184C3AA0D5BA7B8Bd3f6F',
    isActive: true,
    network: 'sepolia',
  },
  {
    id: 'aave-weth-sepolia',
    protocol: 'Aave V3',
    token: 'WETH',
    apy: 2.1,
    tvl: '$8.5B',
    risk: 'Low',
    adapterAddress: '0xFbe1cE67358c2333663738020F861438B7FAe929',
    isActive: true,
    network: 'sepolia',
  },
  {
    id: 'uniswap-wbtc-sepolia',
    protocol: 'Uniswap V3',
    token: 'WBTC',
    apy: 4.8,
    tvl: '$890M',
    risk: 'Medium',
    adapterAddress: '0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178',
    isActive: true,
    network: 'sepolia',
  },
  {
    id: 'aave-usdc-sepolia',
    protocol: 'Aave V3',
    token: 'USDC',
    apy: 1.9,
    tvl: '$12B',
    risk: 'Low',
    adapterAddress: '0xFbe1cE67358c2333663738020F861438B7FAe929',
    isActive: true,
    network: 'sepolia',
  },
];

async function seedIfEmpty() {
  const count = await ProtocolOption.countDocuments();
  if (count > 0) return;

  await ProtocolOption.insertMany(DEFAULT_OPTIONS);
  logger.success(`Seeded ${DEFAULT_OPTIONS.length} default staking options`, {
    service: 'Database',
  });
}

export function isDatabaseConnected(): boolean {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function connectDatabase(): Promise<boolean> {
  const mongoUri = env('MONGO_URI');

  try {
    await mongoose.connect(mongoUri);
    isConnected = true;
    logger.success(`Connected to MongoDB (${mongoUri})`, { service: 'Database' });
    await seedIfEmpty();
    return true;
  } catch (error: any) {
    isConnected = false;
    logger.warn(
      `MongoDB unavailable (${mongoUri}). API routes needing the database will fail until MongoDB is running.`,
      { service: 'Database' }
    );
    logger.warn(error.message, { service: 'Database' });
    return false;
  }
}
