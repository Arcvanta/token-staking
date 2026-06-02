import { useState, useEffect } from 'react';
import { priceService } from '../services/priceService';

interface UsePricesReturn {
  prices: Record<string, number>;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage token prices
 * 
 * @param tokenSymbols - Array of token symbols to fetch prices for
 * @param autoRefresh - Whether to auto-refresh prices (default: true)
 * @param refreshInterval - Refresh interval in ms (default: 60000 = 1 minute)
 */
export function usePrices(
  tokenSymbols: string[],
  autoRefresh: boolean = true,
  refreshInterval: number = 60000
): UsePricesReturn {
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    if (tokenSymbols.length === 0) {
      setIsLoading(false);
      return;
    }

    try {
      setError(null);
      const fetchedPrices = await priceService.getPrices(tokenSymbols);
      setPrices(fetchedPrices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      console.error('Error fetching prices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();

    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchPrices, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [tokenSymbols.join(','), autoRefresh, refreshInterval]);

  return {
    prices,
    isLoading,
    error,
    refetch: fetchPrices,
  };
}

/**
 * Hook to calculate USD value for a specific token amount
 */
export function useTokenUsdValue(tokenSymbol: string, amount: number) {
  const { prices, isLoading } = usePrices([tokenSymbol]);
  const price = prices[tokenSymbol] || 0;
  const usdValue = amount * price;

  return {
    usdValue,
    price,
    isLoading,
  };
}
