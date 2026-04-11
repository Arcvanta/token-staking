import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProtocolOption from './models/ProtocolOption';
import logger from './utils/logger';

dotenv.config();

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found');
    }

    await mongoose.connect(mongoUri);
    logger.success('Connected to MongoDB', { service: 'Seed' });

    // Clear existing data
    await ProtocolOption.deleteMany({});
    logger.info('Cleared existing protocol options', { service: 'Seed' });

    // Seed data - Updated with deployed Sepolia adapter addresses
    const options = [
      {
        id: 'uniswap-weth-sepolia',
        protocol: 'Uniswap V3',
        token: 'WETH',
        apy: 5.2,
        tvl: '$1.2B',
        risk: 'Medium',
        adapterAddress: '0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178',
        isActive: true,
        network: 'sepolia'
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
        network: 'sepolia'
      },
      {
        id: 'aave-weth-sepolia',
        protocol: 'Aave V3',
        token: 'WETH',
        apy: 2.1,
        tvl: '$4B',
        risk: 'Low',
        adapterAddress: '0xFbe1cE67358c2333663738020F861438B7FAe929',
        isActive: true,
        network: 'sepolia'
      },
      {
        id: 'uniswap-wbtc-sepolia',
        protocol: 'Uniswap V3',
        token: 'WBTC',
        apy: 4.5,
        tvl: '$500M',
        risk: 'Medium',
        adapterAddress: '0x5e01a1cBdfddA63D20d74E121B778d87A5AC0178',
        isActive: true,
        network: 'sepolia'
      },
      {
        id: 'aave-wbtc-sepolia',
        protocol: 'Aave V3',
        token: 'WBTC',
        apy: 1.5,
        tvl: '$1B',
        risk: 'Low',
        adapterAddress: '0xFbe1cE67358c2333663738020F861438B7FAe929',
        isActive: true,
        network: 'sepolia'
      },
      {
        id: 'aave-usdc-sepolia',
        protocol: 'Aave V3',
        token: 'USDC',
        apy: 3.2,
        tvl: '$2B',
        risk: 'Low',
        adapterAddress: '0xFbe1cE67358c2333663738020F861438B7FAe929',
        isActive: true,
        network: 'sepolia'
      }
    ];

    await ProtocolOption.insertMany(options);
    logger.success(`Seeded ${options.length} protocol options`, { service: 'Seed' });

    await mongoose.connection.close();
    logger.success('Database seeding completed', { service: 'Seed' });
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding error: ${error}`, { service: 'Seed' });
    process.exit(1);
  }
};

seedData();
