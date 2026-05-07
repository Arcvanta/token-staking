/**
 * Price Service
 * 
 * Handles fetching and caching of token prices in USD.
 * Uses CoinGecko API (free tier) with fallback mechanisms.
 * 
 * Design Principles:
 * - Single Responsibility: Only handles price fetching
 * - Caching: Reduces API calls and improves performance
 * - Error Handling: Graceful degradation with fallbacks
 */

interface TokenPrice {
  usd: number;
  lastUpdated: number;
}

interface PriceCache {
  [tokenSymbol: string]: TokenPrice;
}

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// Token ID mapping for CoinGecko
const TOKEN_IDS: Record<string, string> = {
  'WETH': 'ethereum',
  'ETH': 'ethereum',
  'WBTC': 'wrapped-bitcoin',
  'BTC': 'bitcoin',
  'USDC': 'usd-coin',
  'SOL': 'solana',
};

class PriceService {
  private cache: PriceCache = {};
  private apiUrl = 'https://api.coingecko.com/api/v3/simple/price';

  /**
   * Get price for a single token
   */
  async getPrice(tokenSymbol: string): Promise<number> {
    const cached = this.getCachedPrice(tokenSymbol);
    if (cached !== null) {
      return cached;
    }

    try {
      const price = await this.fetchPrice(tokenSymbol);
      this.cachePrice(tokenSymbol, price);
      return price;
    } catch (error) {
      console.error(`Failed to fetch price for ${tokenSymbol}:`, error);
      return this.getFallbackPrice(tokenSymbol);
    }
  }

  /**
   * Get prices for multiple tokens in one call
   */
  async getPrices(tokenSymbols: string[]): Promise<Record<string, number>> {
    const prices: Record<string, number> = {};
    
    // Separate cached and non-cached tokens
    const uncachedTokens: string[] = [];
    
    for (const symbol of tokenSymbols) {
      const cached = this.getCachedPrice(symbol);
      if (cached !== null) {
        prices[symbol] = cached;
      } else {
        uncachedTokens.push(symbol);
      }
    }

    // Fetch uncached tokens
    if (uncachedTokens.length > 0) {
      try {
        const fetchedPrices = await this.fetchPrices(uncachedTokens);
        Object.assign(prices, fetchedPrices);
        
        // Cache the fetched prices
        for (const [symbol, price] of Object.entries(fetchedPrices)) {
          this.cachePrice(symbol, price);
        }
      } catch (error) {
        console.error('Failed to fetch prices:', error);
        // Use fallback for failed tokens
        for (const symbol of uncachedTokens) {
          prices[symbol] = this.getFallbackPrice(symbol);
        }
      }
    }

    return prices;
  }

  /**
   * Calculate USD value for a token amount
   */
  async calculateUsdValue(tokenSymbol: string, amount: number): Promise<number> {
    const price = await this.getPrice(tokenSymbol);
    return amount * price;
  }

  /**
   * Fetch price from CoinGecko API
   */
  private async fetchPrice(tokenSymbol: string): Promise<number> {
    const tokenId = TOKEN_IDS[tokenSymbol.toUpperCase()];
    if (!tokenId) {
      throw new Error(`Unknown token: ${tokenSymbol}`);
    }

    const response = await fetch(
      `${this.apiUrl}?ids=${tokenId}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const price = data[tokenId]?.usd;

    if (typeof price !== 'number') {
      throw new Error(`Invalid price data for ${tokenSymbol}`);
    }

    return price;
  }

  /**
   * Fetch multiple prices in one API call
   */
  private async fetchPrices(tokenSymbols: string[]): Promise<Record<string, number>> {
    const tokenIds = tokenSymbols
      .map(s => TOKEN_IDS[s.toUpperCase()])
      .filter(Boolean);

    if (tokenIds.length === 0) {
      return {};
    }

    const response = await fetch(
      `${this.apiUrl}?ids=${tokenIds.join(',')}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const prices: Record<string, number> = {};

    for (const symbol of tokenSymbols) {
      const tokenId = TOKEN_IDS[symbol.toUpperCase()];
      if (tokenId && data[tokenId]?.usd) {
        prices[symbol] = data[tokenId].usd;
      }
    }

    return prices;
  }

  /**
   * Get cached price if still valid
   */
  private getCachedPrice(tokenSymbol: string): number | null {
    const cached = this.cache[tokenSymbol.toUpperCase()];
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.lastUpdated > CACHE_DURATION) {
      delete this.cache[tokenSymbol.toUpperCase()];
      return null;
    }

    return cached.usd;
  }

  /**
   * Cache a price
   */
  private cachePrice(tokenSymbol: string, price: number): void {
    this.cache[tokenSymbol.toUpperCase()] = {
      usd: price,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get fallback price (approximate values for when API fails)
   */
  private getFallbackPrice(tokenSymbol: string): number {
    const fallbacks: Record<string, number> = {
      'WETH': 3500,
      'ETH': 3500,
      'WBTC': 95000,
      'BTC': 95000,
      'USDC': 1,
      'SOL': 200,
    };

    return fallbacks[tokenSymbol.toUpperCase()] || 0;
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache(): void {
    this.cache = {};
  }
}

// Export singleton instance
export const priceService = new PriceService();

// Export class for testing
export { PriceService };
