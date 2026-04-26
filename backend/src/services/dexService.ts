import axios from 'axios';
import logger from '../utils/logger';
import { getConfiguredAdapters, calculateRisk, AdapterConfig } from '../config/adapters';

// DeFiLlama Yields API
const DEFILLAMA_YIELDS_URL = 'https://yields.llama.fi/pools';

export interface DEXData {
  protocol: string;
  token: string;
  apy: number;
  tvl: string;
  tvlUsd: number; // Raw TVL for risk calculation
  risk: 'Low' | 'Medium' | 'High';
  adapterAddress: string; // Include adapter address directly
}

interface LlamaPool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number;
  pool: string;
}

/**
 * Fetch yields data from DeFiLlama and map to configured adapters only
 * 
 * Key improvements:
 * 1. Only returns data for protocols we have adapters for
 * 2. Calculates risk dynamically based on TVL
 * 3. Includes adapter address in response
 */
export async function fetchAllTokensData(): Promise<Record<string, DEXData[]>> {
  const result: Record<string, DEXData[]> = {};
  
  // Get configured adapters (only those with valid addresses)
  const configuredAdapters = getConfiguredAdapters();
  
  if (configuredAdapters.length === 0) {
    logger.warn('No adapters configured, skipping DeFiLlama fetch', { 
      service: 'DEXService', method: 'fetchAllTokensData' 
    });
    return result;
  }

  try {
    logger.info('Fetching real yields from DeFiLlama...', { 
      service: 'DEXService', method: 'fetchAllTokensData' 
    });

    const response = await axios.get(DEFILLAMA_YIELDS_URL, { timeout: 30000 });
    const pools: LlamaPool[] = response.data.data;

    logger.info(`Received ${pools.length} pools from DeFiLlama`, { 
      service: 'DEXService', method: 'fetchAllTokensData' 
    });

    // Helper to format TVL for display
    const formatTVL = (num: number): string => {
      if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
      if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
      if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
      return `$${num.toFixed(0)}`;
    };

    // Process each configured adapter
    for (const adapterConfig of configuredAdapters) {
      // Find matching pools from DeFiLlama
      const matchingPools = pools.filter(p => 
        p.project === adapterConfig.protocolId && 
        p.chain === 'Ethereum'
      );

      if (matchingPools.length === 0) {
        logger.warn(`No DeFiLlama pools found for ${adapterConfig.protocol}`, {
          service: 'DEXService', method: 'fetchAllTokensData'
        });
        continue;
      }

      // Process each supported token
      for (const token of adapterConfig.supportedTokens) {
        // Initialize token array if needed
        if (!result[token]) {
          result[token] = [];
        }

        // Find the best pool for this token
        let pool: LlamaPool | undefined;

        if (adapterConfig.protocolId === 'lido') {
          // Lido: Look for stETH
          pool = matchingPools.find(p => p.symbol === 'STETH');
        } else if (adapterConfig.protocolId === 'aave-v3') {
          // Aave: Direct token match
          pool = matchingPools.find(p => p.symbol === token);
        } else if (adapterConfig.protocolId === 'uniswap-v3') {
          // Uniswap: Find pools containing the token with good TVL
          pool = matchingPools
            .filter(p => p.symbol.includes(token) && p.tvlUsd > 1_000_000)
            .sort((a, b) => b.tvlUsd - a.tvlUsd)[0]; // Highest TVL pool
        }

        if (pool) {
          const dynamicRisk = calculateRisk(adapterConfig.baseRisk, pool.tvlUsd);
          
          result[token].push({
            protocol: adapterConfig.protocol,
            token: token,
            apy: pool.apy || pool.apyBase || 0,
            tvl: formatTVL(pool.tvlUsd),
            tvlUsd: pool.tvlUsd,
            risk: dynamicRisk,
            adapterAddress: adapterConfig.adapter
          });

          logger.info(`Added ${adapterConfig.protocol} ${token}: APY=${pool.apy?.toFixed(2)}%, TVL=${formatTVL(pool.tvlUsd)}, Risk=${dynamicRisk}`, {
            service: 'DEXService', method: 'fetchAllTokensData'
          });
        }
      }
    }

    const totalOptions = Object.values(result).reduce((sum, arr) => sum + arr.length, 0);
    logger.success(`Successfully processed ${totalOptions} staking options from DeFiLlama`, { 
      service: 'DEXService', method: 'fetchAllTokensData' 
    });

  } catch (error: any) {
    logger.error(`Error fetching DeFiLlama data: ${error.message}`, { 
      service: 'DEXService', method: 'fetchAllTokensData' 
    });
    // Return empty result - the job will keep existing data in DB
  }

  return result;
}

// Legacy functions - kept for compatibility
export async function fetchUniswapData(token: string): Promise<DEXData | null> { return null; }
export async function fetchAaveData(token: string): Promise<DEXData | null> { return null; }
export async function fetchLidoData(): Promise<DEXData | null> { return null; }
export async function fetchAllDEXData(token: string): Promise<DEXData[]> { return []; }
