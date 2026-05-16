import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProtocolOption from './models/ProtocolOption';
import logger from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const seedLocalhost = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found');
    }

    await mongoose.connect(mongoUri);
    logger.success('Connected to MongoDB', { service: 'SeedLocalhost' });

    // Read deployment file
    const deploymentPath = path.join(__dirname, '../../contracts/deployments/localhost.json');
    
    if (!fs.existsSync(deploymentPath)) {
      throw new Error(`Deployment file not found: ${deploymentPath}`);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
    logger.info('Loaded deployment info for localhost', { service: 'SeedLocalhost' });

    // Clear existing localhost options
    await ProtocolOption.deleteMany({ network: 'localhost' });
    logger.info('Cleared existing localhost options', { service: 'SeedLocalhost' });

    // Create options with deployed adapter addresses
    const options = [
      {
        id: 'uniswap-eth-localhost',
        protocol: 'Uniswap V3',
        token: 'ETH',
        apy: 5.2,
        tvl: '$1.2B',
        risk: 'Medium',
        adapterAddress: deployment.contracts.Adapters.Uniswap,
        isActive: true,
        network: 'localhost'
      },
      {
        id: 'lido-eth-localhost',
        protocol: 'Lido',
        token: 'ETH',
        apy: 3.8,
        tvl: '$15B',
        risk: 'Low',
        adapterAddress: deployment.contracts.Adapters.Lido,
        isActive: true,
        network: 'localhost'
      },
      {
        id: 'aave-eth-localhost',
        protocol: 'Aave V3',
        token: 'ETH',
        apy: 2.1,
        tvl: '$4B',
        risk: 'Low',
        adapterAddress: deployment.contracts.Adapters.Aave,
        isActive: true,
        network: 'localhost'
      },
      {
        id: 'uniswap-wbtc-localhost',
        protocol: 'Uniswap V3',
        token: 'WBTC',
        apy: 4.5,
        tvl: '$500M',
        risk: 'Medium',
        adapterAddress: deployment.contracts.Adapters.Uniswap,
        isActive: true,
        network: 'localhost'
      },
      {
        id: 'aave-wbtc-localhost',
        protocol: 'Aave V3',
        token: 'WBTC',
        apy: 1.5,
        tvl: '$1B',
        risk: 'Low',
        adapterAddress: deployment.contracts.Adapters.Aave,
        isActive: true,
        network: 'localhost'
      },
      {
        id: 'aave-usdc-localhost',
        protocol: 'Aave V3',
        token: 'USDC',
        apy: 3.2,
        tvl: '$2B',
        risk: 'Low',
        adapterAddress: deployment.contracts.Adapters.Aave,
        isActive: true,
        network: 'localhost'
      }
    ];

    await ProtocolOption.insertMany(options);
    logger.success(`Seeded ${options.length} localhost protocol options with deployed adapters`, { service: 'SeedLocalhost' });

    await mongoose.connection.close();
    logger.success('Database seeding completed for localhost', { service: 'SeedLocalhost' });
    process.exit(0);
  } catch (error) {
    logger.error(`Seeding error: ${error}`, { service: 'SeedLocalhost' });
    process.exit(1);
  }
};

seedLocalhost();
