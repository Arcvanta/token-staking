import { useState } from 'react';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { logger } from '../utils/logger';

// ABI mínimo para unstake
const STAKING_ROUTER_ABI = [
  {
    name: 'unstake',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'adapter', type: 'address' }
    ],
    outputs: []
  }
] as const;

// Token addresses from env
const TOKEN_ADDRESSES: Record<string, Address> = {
  WETH: (process.env.NEXT_PUBLIC_SEPOLIA_WETH as Address) || '0x918530d86c239f92E58A98CE8ed446DC042613DB',
  WBTC: (process.env.NEXT_PUBLIC_SEPOLIA_WBTC as Address) || '0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B',
  SOL: (process.env.NEXT_PUBLIC_SEPOLIA_USDC as Address) || '0xaDD1Fbe72192A8328AeD0EA6E1f729fde11Fd8Ad',
};

const STAKING_ROUTER_ADDRESS = (process.env.NEXT_PUBLIC_SEPOLIA_STAKING_ROUTER as Address) || '0xe7489b54feF646bf318F043AB7E8A6a1cb456116';

const TOKEN_DECIMALS: Record<string, number> = {
  WETH: 18,
  WBTC: 8,
  SOL: 6,
};

export function useUnstake() {
  const { address } = useAccount();
  const [currentStep, setCurrentStep] = useState<'idle' | 'unstaking' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const unstake = async (position: any, amount: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (!publicClient) {
      throw new Error('Public client not initialized');
    }

    setError(null);
    setCurrentStep('unstaking');

    try {
      const tokenAddress = TOKEN_ADDRESSES[position.token];
      const decimals = TOKEN_DECIMALS[position.token] || 18;
      const amountWei = parseUnits(amount, decimals);

      logger.info('Unstaking tokens...', { 
        component: 'useUnstake', 
        action: 'unstake', 
        protocol: position.protocol,
        amount 
      });
      
      const unstakeTx = await writeContractAsync({
        address: STAKING_ROUTER_ADDRESS,
        abi: STAKING_ROUTER_ABI,
        functionName: 'unstake',
        args: [tokenAddress, amountWei, position.adapterAddress as Address],
        gas: BigInt(500000), 
      });

      logger.info('Unstake tx sent, waiting for confirmation...', { component: 'useUnstake', txHash: unstakeTx });
      setTxHash(unstakeTx);

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash: unstakeTx });
      
      logger.info('Transaction receipt received', { 
        component: 'useUnstake', 
        txHash: unstakeTx,
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber.toString()
      });
      
      if (receipt.status !== 'success') {
        logger.error('Transaction reverted on chain', { 
          component: 'useUnstake', 
          txHash: unstakeTx,
          receipt: {
            status: receipt.status,
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: receipt.blockNumber.toString()
          }
        });
        throw new Error(`Transaction failed on chain. Status: ${receipt.status}. Check Etherscan: https://sepolia.etherscan.io/tx/${unstakeTx}`);
      }

      logger.success('Unstake confirmed on chain', { component: 'useUnstake', txHash: unstakeTx });

      // Update backend
      await updateUnstakeStatus({
        userAddress: address,
        protocol: position.protocol,
        token: position.token,
        amount,
        txHash: unstakeTx,
        status: 'unstaked',
        network: 'sepolia',
      });

      setCurrentStep('success');
      return unstakeTx;

    } catch (err: any) {
      logger.error('Unstaking error', { component: 'useUnstake', error: err.message });
      setError(err.message || 'Transaction failed');
      setCurrentStep('error');
      throw err;
    }
  };

  const reset = () => {
    setCurrentStep('idle');
    setError(null);
    setTxHash(null);
  };

  return {
    unstake,
    currentStep,
    error,
    txHash,
    reset,
    isLoading: currentStep === 'unstaking',
  };
}

// Helper to update backend
async function updateUnstakeStatus(data: any) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';
  
  logger.info('Updating unstake status in backend...', { component: 'updateUnstakeStatus', data });
  
  try {
    const response = await fetch(`${API_URL}/api/transactions/unstake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to update unstake status', { component: 'updateUnstakeStatus', status: response.status, error: errorText });
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    logger.success('Unstake status updated in backend', { component: 'updateUnstakeStatus', result });
    return result;
  } catch (error) {
    logger.error('Error updating unstake status', { component: 'updateUnstakeStatus', error });
    // Don't throw - unstake succeeded on-chain, backend update is secondary
  }
}
