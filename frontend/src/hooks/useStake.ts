import { useState } from 'react';
import { useAccount, useWriteContract, usePublicClient, useReadContract } from 'wagmi';
import { parseUnits, Address } from 'viem';
import { StakingOption } from './useStakingOptions';
import { logger } from '../utils/logger';

// ABIs mínimos
const ERC20_ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    outputs: [{ type: 'uint256' }]
  }
] as const;

const STAKING_ROUTER_ABI = [
  {
    name: 'stake',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'token', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'adapter', type: 'address' }
    ],
    outputs: []
  },
  {
    name: 'feeBasisPoints',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  }
] as const;

// Token addresses from env
const TOKEN_ADDRESSES: Record<string, Address> = {
  WETH: (process.env.NEXT_PUBLIC_SEPOLIA_WETH as Address) || '0x918530d86c239f92E58A98CE8ed446DC042613DB',
  WBTC: (process.env.NEXT_PUBLIC_SEPOLIA_WBTC as Address) || '0xA32ecf29Ed19102A639cd1a9706079d055f3CF2B',
  SOL: (process.env.NEXT_PUBLIC_SEPOLIA_USDC as Address) || '0xaDD1Fbe72192A8328AeD0EA6E1f729fde11Fd8Ad', // MockSOL (using USDC address)
};

const STAKING_ROUTER_ADDRESS = (process.env.NEXT_PUBLIC_SEPOLIA_STAKING_ROUTER as Address) || '0xe7489b54feF646bf318F043AB7E8A6a1cb456116';

const TOKEN_DECIMALS: Record<string, number> = {
  WETH: 18,
  WBTC: 8,
  SOL: 6, // Using USDC decimals for MockSOL
};

export function useStake() {
  const { address } = useAccount();
  const [currentStep, setCurrentStep] = useState<'idle' | 'approving' | 'staking' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  // Read fee from contract
  const { data: feeBasisPoints } = useReadContract({
    address: STAKING_ROUTER_ADDRESS,
    abi: STAKING_ROUTER_ABI,
    functionName: 'feeBasisPoints',
  });

  const stake = async (option: StakingOption, amount: string) => {
    if (!address) {
      throw new Error('Wallet not connected');
    }

    if (!publicClient) {
      throw new Error('Public client not initialized');
    }

    setError(null);
    setError(null);

    try {
      const tokenAddress = TOKEN_ADDRESSES[option.token];
      const decimals = TOKEN_DECIMALS[option.token] || 18;
      const amountWei = parseUnits(amount, decimals);

      if (!option.adapterAddress || option.adapterAddress === '0x0000000000000000000000000000000000000000') {
        throw new Error('Invalid adapter address configuration. Please refresh the page to update protocol data.');
      }

      // Step 1: Check Allowance
      logger.info('Checking current allowance ' + tokenAddress, { component: 'useStake', method: 'stake' });

      const currentAllowance = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, STAKING_ROUTER_ADDRESS]
      }) as bigint;

      if (currentAllowance < amountWei) {
        setCurrentStep('approving');
        // Use infinite approval (max uint256) - common DeFi pattern
        const maxApproval = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");

        logger.info('Approving token spend (infinite): ' + tokenAddress, { component: 'useStake', method: 'stake' });
        const approveTx = await writeContractAsync({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [STAKING_ROUTER_ADDRESS, maxApproval],
          gas: BigInt(100000),
        });

        logger.success('Approval tx sent: ' + approveTx, { component: 'useStake', method: 'stake' });

        // Wait for approval confirmation
        await publicClient.waitForTransactionReceipt({ hash: approveTx });
        logger.success('Approval confirmed: ' + approveTx, { component: 'useStake', method: 'stake' });

        // Double check allowance after approval to ensure node consistency
        const newAllowance = await publicClient.readContract({
          address: tokenAddress,
          abi: ERC20_ABI,
          functionName: 'allowance',
          args: [address, STAKING_ROUTER_ADDRESS]
        }) as bigint;

        if (newAllowance < amountWei) {
          throw new Error('Approval failed or not yet propagated. Please try again.');
        }
      } else {
        logger.info('Allowance sufficient, skipping approval: ' + currentAllowance.toString(), { component: 'useStake', method: 'stake' });
      }

      // Step 2: Stake
      setCurrentStep('staking');
      logger.info('Staking tokens: ' + tokenAddress, { component: 'useStake', method: 'stake' });

      const stakeArgs = [tokenAddress, amountWei, option.adapterAddress as Address];
      logger.info('Stake Arguments: ' + {
        token: tokenAddress,
        amount: amountWei.toString(),
        adapter: option.adapterAddress,
        router: STAKING_ROUTER_ADDRESS
      }, {
        component: 'useStake',
        method: 'stake',
      });

      // Estimate gas first to catch errors early and set proper limit
      let gasLimit = BigInt(500000); // Fallback
      try {
        const estimatedGas = await publicClient.estimateContractGas({
          address: STAKING_ROUTER_ADDRESS,
          abi: STAKING_ROUTER_ABI,
          functionName: 'stake',
          args: [tokenAddress, amountWei, option.adapterAddress as Address],
          account: address
        });
        // Add 20% buffer
        gasLimit = (estimatedGas * BigInt(120)) / BigInt(100);
        logger.info('Gas estimated: ' + {
          estimated: estimatedGas.toString(),
          limit: gasLimit.toString()
        }, {
          component: 'useStake',
          method: 'stake',
        });
      } catch (gasError: any) {
        logger.warn('Gas estimation failed, using fallback: ' + gasError.message, {
          component: 'useStake',
          method: 'stake',
        });
        // If estimation fails, it usually means the tx will revert. 
        // We'll let it proceed with fallback so user sees the real error, 
        // or we could throw here.
      }

      const stakeTx = await writeContractAsync({
        address: STAKING_ROUTER_ADDRESS,
        abi: STAKING_ROUTER_ABI,
        functionName: 'stake',
        args: [tokenAddress, amountWei, option.adapterAddress as Address],
        gas: gasLimit,
      });

      logger.info('Stake tx sent, waiting for confirmation: ' + stakeTx, { component: 'useStake', method: 'stake' });
      setTxHash(stakeTx);

      // Wait for transaction receipt with longer timeout and retry logic
      logger.info('Waiting for transaction receipt: ' + stakeTx, { component: 'useStake', method: 'stake' });

      let receipt;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          receipt = await publicClient.waitForTransactionReceipt({
            hash: stakeTx,
            timeout: 120_000, // 2 minutes timeout (increased from default 12s)
            pollingInterval: 2_000, // Check every 2 seconds
          });
          break; // Success, exit retry loop
        } catch (error: any) {
          retries++;
          if (retries >= maxRetries) {
            // After max retries, check if transaction exists on chain
            logger.warn('Max retries reached, checking transaction status: ' + {
              txHash: stakeTx,
              retries
            }, {
              component: 'useStake',
              method: 'stake',
            });

            // Try one more time with even longer timeout
            receipt = await publicClient.waitForTransactionReceipt({
              hash: stakeTx,
              timeout: 180_000, // 3 minutes final attempt
            });
          } else {
            logger.warn('Receipt fetch failed, retrying... ' + {
              txHash: stakeTx,
              retry: retries,
              error: error.message
            }, {
              component: 'useStake',
              method: 'stake',
            });
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }
      }

      if (!receipt) {
        throw new Error('Failed to get transaction receipt after multiple attempts');
      }

      logger.info('Transaction receipt received', {
        component: 'useStake',
        txHash: stakeTx,
        status: receipt.status,
        gasUsed: receipt.gasUsed.toString(),
        blockNumber: receipt.blockNumber.toString()
      });

      if (receipt.status !== 'success') {
        logger.error('Transaction reverted on chain' + {
          txHash: stakeTx,
          receipt: {
            status: receipt.status,
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: receipt.blockNumber.toString()
          }
        }, {
          component: 'useStake',
          method: 'stake',
        });
        throw new Error(`Transaction failed on chain. Status: ${receipt.status}. Check Etherscan for details: https://sepolia.etherscan.io/tx/${stakeTx}`);
      }

      logger.success('Transaction confirmed on chain' + {
        txHash: stakeTx,
        blockNumber: receipt.blockNumber.toString()
      }, {
        component: 'useStake',
        method: 'stake',
      });

      // Save to backend as CONFIRMED
      await saveTransaction({
        userAddress: address,
        protocol: option.protocol,
        token: option.token,
        tokenAddress: tokenAddress, // Required by backend model
        amount,
        txHash: stakeTx,
        status: 'confirmed',
        adapterAddress: option.adapterAddress,
        network: 'sepolia',
        fee: receipt.gasUsed.toString(), // Gas fee used
      });

      setCurrentStep('success');
      return stakeTx;

    } catch (err: any) {
      logger.error('Staking error' + {
        error: err.message
      }, {
        component: 'useStake',
        method: 'stake',
      });
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
    stake,
    currentStep,
    error,
    txHash,
    reset,
    isLoading: currentStep === 'approving' || currentStep === 'staking',
    feeBasisPoints: feeBasisPoints ? Number(feeBasisPoints) : 0
  };
}

// Helper to save transaction to backend
async function saveTransaction(data: any) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

  logger.info('Saving transaction to backend...' + {
    data
  }, {
    component: 'saveTransaction',
    method: 'saveTransaction',
  });

  try {
    const response = await fetch(`${API_URL}/api/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Failed to save transaction' + {
        status: response.status,
        error: errorText
      }, {
        component: 'saveTransaction',
        method: 'saveTransaction',
      });
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const savedTx = await response.json();
    logger.success('Transaction saved to backend' + {
      id: savedTx._id
    }, {
      component: 'saveTransaction',
      method: 'saveTransaction',
    });
    return savedTx;
  } catch (error) {
    logger.error('Error saving transaction to backend' + {
      error
    }, {
      component: 'saveTransaction',
      method: 'saveTransaction',
    });
    throw error;
  }
}
