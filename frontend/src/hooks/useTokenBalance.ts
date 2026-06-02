import { useReadContract, useAccount } from 'wagmi';
import { Address } from 'viem';

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }]
  }
] as const;

const TOKEN_ADDRESSES: Record<string, Address> = {
  WETH: (process.env.NEXT_PUBLIC_SEPOLIA_WETH as Address) || '0x0fe44892c3279c09654f3590cf6CedAc3FC3ccdc',
  WBTC: (process.env.NEXT_PUBLIC_SEPOLIA_WBTC as Address) || '0x8762c93f84dcB6f9782602D842a587409b7Cf6cd',
  USDC: (process.env.NEXT_PUBLIC_SEPOLIA_USDC as Address) || '0xd28824F4515fA0FeDD052eA70369EA6175a4e18b',
};

const TOKEN_DECIMALS: Record<string, number> = {
  WETH: 18,
  WBTC: 8,
  USDC: 6,
};

export function useTokenBalance(token: string) {
  const { address } = useAccount();
  const tokenAddress = TOKEN_ADDRESSES[token];
  const decimals = TOKEN_DECIMALS[token] || 18;

  const { data: balance, isLoading, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const formattedBalance = balance 
    ? (Number(balance) / Math.pow(10, decimals)).toFixed(6)
    : '0';

  return {
    balance: formattedBalance,
    rawBalance: balance,
    isLoading,
    refetch,
  };
}
