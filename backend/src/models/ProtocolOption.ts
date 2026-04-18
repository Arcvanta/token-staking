import mongoose, { Schema, Document } from 'mongoose';

export interface IProtocolOption extends Document {
  id: string;
  protocol: string;
  token: string;
  apy: number;
  tvl: string;
  risk: 'Low' | 'Medium' | 'High';
  adapterAddress: string;
  isActive: boolean;
  network: string;
}

const ProtocolOptionSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  protocol: { type: String, required: true },
  token: { type: String, required: true, index: true },
  apy: { type: Number, required: true },
  tvl: { type: String, required: true },
  risk: { type: String, enum: ['Low', 'Medium', 'High'], required: true },
  adapterAddress: { type: String, required: true },
  isActive: { type: Boolean, default: true },
  network: { type: String, required: true }
}, {
  timestamps: true
});

export default mongoose.model<IProtocolOption>('ProtocolOption', ProtocolOptionSchema);
