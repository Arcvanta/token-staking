import mongoose, { Schema, Document } from 'mongoose';

export interface IStakingTransaction extends Document {
  userAddress: string;
  token: string; // Symbol (e.g., "WETH")
  tokenAddress: string; // Contract address (e.g., "0x...")
  amount: string;
  protocol: string;
  adapterAddress: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed' | 'unstaked';
  fee: string;
  timestamp: Date;
  network: string;
  unstakeTxHash?: string;
  unstakedAt?: Date;
}

const StakingTransactionSchema: Schema = new Schema({
  userAddress: { type: String, required: true, index: true },
  token: { type: String, required: true },
  tokenAddress: { type: String, required: true },
  amount: { type: String, required: true },
  protocol: { type: String, required: true },
  adapterAddress: { type: String, required: true },
  txHash: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'confirmed', 'failed', 'unstaked'], default: 'pending' },
  fee: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  network: { type: String, required: true },
  unstakeTxHash: { type: String },
  unstakedAt: { type: Date }
});

export default mongoose.model<IStakingTransaction>('StakingTransaction', StakingTransactionSchema);
