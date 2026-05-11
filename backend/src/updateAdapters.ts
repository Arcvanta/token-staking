import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import ProtocolOption from './models/ProtocolOption';
import logger from './utils/logger';

dotenv.config();

const updateAdapters = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found');
    }

    await mongoose.connect(mongoUri);
    logger.success('Connected to MongoDB', { service: 'UpdateAdapters' });

    // Read deployment file
    const network = process.env.ACTIVE_NETWORK || 'sepolia';
    const deploymentPath = path.join(__dirname, '../../contracts/deployments', `${network}.json`);
    
    if (!fs.existsSync(deploymentPath)) {
      throw new Error(`Deployment file not found: ${deploymentPath}`);
    }

    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf-8'));
    logger.info(`Loaded deployment info for ${network}`, { service: 'UpdateAdapters' });

    // Map protocol names to adapter addresses
    const adapterMapping = {
      'Uniswap V3': deployment.contracts.Adapters.Uniswap,
      'Aave V3': deployment.contracts.Adapters.Aave,
      'Lido': deployment.contracts.Adapters.Lido
    };

    // Update each protocol option
    for (const [protocol, address] of Object.entries(adapterMapping)) {
      const result = await ProtocolOption.updateMany(
        { protocol, network },
        { $set: { adapterAddress: address } }
      );
      
      logger.success(
        `Updated ${result.modifiedCount} options for ${protocol} with address ${address}`,
        { service: 'UpdateAdapters' }
      );
    }

    logger.success('All adapters updated successfully', { service: 'UpdateAdapters' });
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    logger.error(`Update error: ${error}`, { service: 'UpdateAdapters' });
    process.exit(1);
  }
};

updateAdapters();
