import { useQuery } from '@tanstack/react-query';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

export interface StakingOption {
  id: string;
  protocol: string;
  token: string;
  apy: number;
  tvl: string;
  risk: 'Low' | 'Medium' | 'High';
  adapterAddress: string;
  network: string;
}

async function fetchOptions(network: string = 'sepolia'): Promise<StakingOption[]> {
  const response = await fetch(`${API_URL}/api/options?network=${network}`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
}

export function useStakingOptions(network: string = 'sepolia') {
  return useQuery({
    queryKey: ['stakingOptions', network],
    queryFn: () => fetchOptions(network),
    refetchInterval: 60000, // Refetch every minute
  });
}
