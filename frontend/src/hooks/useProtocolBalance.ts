import { useReadContract } from 'wagmi';
import { STAKING_ROUTER_ABI } from '@/config/contracts';
import { Address } from 'viem';

export function useProtocolBalance(
  adapterAddress: string,
  tokenAddress: string,
  userAddress: string | undefined,
  stakingRouterAddress: string
) {
  const { data: balance, isError, isLoading, refetch } = useReadContract({
    address: stakingRouterAddress as Address,
    abi: STAKING_ROUTER_ABI,
    functionName: 'getProtocolBalance',
    args: [adapterAddress as Address, tokenAddress as Address, userAddress as Address],
    query: {
      enabled: !!adapterAddress && !!tokenAddress && !!userAddress && !!stakingRouterAddress,
      refetchInterval: 10000, // Refetch every 10 seconds for near real-time updates
    }
  });

  return {
    balance: balance as bigint | undefined,
    isError,
    isLoading,
    refetch
  };
}

