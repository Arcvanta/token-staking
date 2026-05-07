import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ProtocolOption from './models/ProtocolOption';
import { fetchAllTokensData } from './services/dexService';
import { getRedisClient } from './config/redis';

dotenv.config();

async function diagnose() {
  console.log('🔍 Starting diagnosis...');

  // 1. Check DB Connection and Data
  try {
    await mongoose.connect(process.env.MONGO_URI || '');
    console.log('✅ MongoDB Connected');

    const count = await ProtocolOption.countDocuments();
    console.log(`📊 Total ProtocolOptions in DB: ${count}`);

    const options = await ProtocolOption.find({});
    console.log('📋 Listing all options:');
    options.forEach(opt => {
      console.log(` - [${opt.network}] ${opt.token} on ${opt.protocol}: APY ${opt.apy}% (ID: ${opt.id})`);
    });

    if (count === 0) {
      console.warn('⚠️ No options found in DB! The queue might not be saving data.');
    }

  } catch (error) {
    console.error('❌ MongoDB Error:', error);
  }

  // 2. Check DeFiLlama Data Fetching
  try {
    console.log('\n🌍 Testing DeFiLlama Fetch...');
    const data = await fetchAllTokensData();
    console.log('📦 Data fetched from DeFiLlama:');
    Object.entries(data).forEach(([token, opts]) => {
      console.log(`  ${token}: ${opts.length} options found`);
      opts.forEach(o => console.log(`    - ${o.protocol}: ${o.apy}%`));
    });
  } catch (error) {
    console.error('❌ DeFiLlama Error:', error);
  }

  // 3. Check Redis
  try {
    console.log('\n🔴 Checking Redis...');
    const ping = await getRedisClient().ping();
    console.log(`✅ Redis PING response: ${ping}`);
  } catch (error) {
    console.error('❌ Redis Error:', error);
  }

  console.log('\n🏁 Diagnosis complete.');
  process.exit(0);
}

diagnose();
