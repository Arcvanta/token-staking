/**
 * Adapter Configuration for Production
 * 
 * This file centralizes all adapter addresses and supported protocol/token combinations.
 * In production, these MUST be set via environment variables.
 * 
 * The job will ONLY create staking options for protocols that have valid adapter addresses.
 */

import logger from '../utils/logger';

export interface AdapterConfig {
  protocol: string;        // Display name (e.g., "Uniswap V3")
  protocolId: string;      // DefiLlama project ID (e.g., "uniswap-v3")
  adapter: string;         // Deployed adapter contract address
  supportedTokens: string[]; // Tokens this adapter supports
  baseRisk: 'Low' | 'Medium' | 'High'; // Base risk level for this protocol type
}

/**
 * Get the configured adapters from environment variables.
 * Only returns adapters with valid addresses.
 */
export function getConfiguredAdapters(): AdapterConfig[] {
  const adapters: AdapterConfig[] = [];

  // Uniswap V3 Adapter
  const uniswapAdapter = process.env.ADAPTER_UNISWAP;
  if (uniswapAdapter && uniswapAdapter !== '0x0000000000000000000000000000000000000000') {
    adapters.push({
      protocol: 'Uniswap V3',
      protocolId: 'uniswap-v3',
      adapter: uniswapAdapter,
      supportedTokens: ['WETH', 'WBTC'],
      baseRisk: 'Medium' // LP pools have impermanent loss risk
    });
  }

  // Aave V3 Adapter
  const aaveAdapter = process.env.ADAPTER_AAVE;
  if (aaveAdapter && aaveAdapter !== '0x0000000000000000000000000000000000000000') {
    adapters.push({
      protocol: 'Aave V3',
      protocolId: 'aave-v3',
      adapter: aaveAdapter,
      supportedTokens: ['WETH', 'WBTC', 'USDC'],
      baseRisk: 'Low' // Lending protocol, well audited
    });
  }

  // Lido Adapter
  const lidoAdapter = process.env.ADAPTER_LIDO;
  if (lidoAdapter && lidoAdapter !== '0x0000000000000000000000000000000000000000') {
    adapters.push({
      protocol: 'Lido',
      protocolId: 'lido',
      adapter: lidoAdapter,
      supportedTokens: ['WETH'],
      baseRisk: 'Low' // Liquid staking, well audited
    });
  }

  // Log configured adapters
  if (adapters.length === 0) {
    logger.warn('No adapters configured! Set ADAPTER_UNISWAP, ADAPTER_AAVE, ADAPTER_LIDO in environment.', {
      service: 'AdapterConfig'
    });
  } else {
    logger.info(`Configured ${adapters.length} adapters: ${adapters.map(a => a.protocol).join(', ')}`, {
      service: 'AdapterConfig'
    });
  }

  return adapters;
}

/**
 * Get adapter address for a specific protocol
 */
export function getAdapterForProtocol(protocol: string): string | null {
  const adapters = getConfiguredAdapters();
  const config = adapters.find(a => a.protocol === protocol);
  return config?.adapter || null;
}

/**
 * Check if a protocol+token combination is supported
 */
export function isSupported(protocol: string, token: string): boolean {
  const adapters = getConfiguredAdapters();
  const config = adapters.find(a => a.protocol === protocol);
  if (!config) return false;
  return config.supportedTokens.includes(token);
}

/**
 * Calculate dynamic risk based on TVL and protocol type
 * Higher TVL = Lower risk (more battle-tested)
 */
export function calculateRisk(
  baseRisk: 'Low' | 'Medium' | 'High',
  tvlUsd: number
): 'Low' | 'Medium' | 'High' {
  // If TVL is very low, increase risk
  if (tvlUsd < 1_000_000) { // Less than $1M
    if (baseRisk === 'Low') return 'Medium';
    if (baseRisk === 'Medium') return 'High';
    return 'High';
  }
  
  // If TVL is very high, could decrease risk (but we keep base for safety)
  // $100M+ is considered very safe for established protocols
  if (tvlUsd > 100_000_000 && baseRisk === 'Medium') {
    return 'Low';
  }
  
  return baseRisk;
}
