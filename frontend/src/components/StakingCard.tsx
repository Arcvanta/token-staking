import Image from 'next/image';
import CountUp from 'react-countup';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';
import { Tooltip } from './ui/Tooltip';
import { TrendingUp, Shield, DollarSign, HelpCircle } from 'lucide-react';
import { StakingOption } from '@/hooks/useStakingOptions';

interface StakingCardProps {
  option: StakingOption;
  onStake: (option: StakingOption) => void;
}

const PROTOCOL_ICONS: Record<string, string> = {
  'Uniswap V3': '/icons/uniswap.png',
  'Aave V3': '/icons/aave.png',
  'Lido': '/icons/lido.png',
  'Marinade': '/icons/marinade.png',
  'Jito': '/icons/jito.png',
};

const TOKEN_ICONS: Record<string, string> = {
  'ETH': '/icons/eth.png',
  'WETH': '/icons/eth.png',
  'WBTC': '/icons/btc.png',
  'USDC': '/icons/dedlyfi.png',
  'SOL': '/icons/solana.png',
};

export function StakingCard({ option, onStake }: StakingCardProps) {
  const riskColors = {
    Low: 'success',
    Medium: 'warning',
    High: 'error',
  } as const;

  const riskDescriptions = {
    Low: 'Minimal risk. Protocol is battle-tested and audited.',
    Medium: 'Moderate risk. Protocol is reliable but has some exposure.',
    High: 'Higher risk. Newer protocol or higher volatility.',
  };

  // Protocol-specific colors (crypto theme)
  const protocolColors: Record<string, { bg: string; border: string; accent: string }> = {
    'Uniswap V3': {
      bg: 'bg-pink-500/5 hover:bg-pink-500/10',
      border: 'border-pink-500/20',
      accent: 'text-pink-400',
    },
    'Aave V3': {
      bg: 'bg-purple-500/5 hover:bg-purple-500/10',
      border: 'border-purple-500/20',
      accent: 'text-purple-400',
    },
    'Lido': {
      bg: 'bg-blue-500/5 hover:bg-blue-500/10',
      border: 'border-blue-500/20',
      accent: 'text-blue-400',
    },
  };

  const colors = protocolColors[option.protocol] || {
    bg: 'bg-gray-500/5 hover:bg-gray-500/10',
    border: 'border-gray-500/20',
    accent: 'text-gray-400',
  };

  return (
    <Card hoverEffect className={`flex flex-col gap-4 border transition-all duration-300 ${colors.border} ${colors.bg}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 flex-shrink-0">
            <div className="h-12 w-12 overflow-hidden rounded-full bg-white/5 p-1 ring-1 ring-white/10">
              <Image 
                src={PROTOCOL_ICONS[option.protocol] || '/icons/dedlyfi.png'} 
                alt={option.protocol}
                width={48}
                height={48}
                className="object-contain"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gray-900 p-0.5 ring-1 ring-black">
              <Image 
                src={TOKEN_ICONS[option.token] || '/icons/dedlyfi.png'} 
                alt={option.token}
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
          </div>
          <div>
            <h3 className={`text-base font-bold ${colors.accent}`}>
              {option.protocol}
            </h3>
            {/* Token name removed as per request, icon is enough */}
          </div>
        </div>
        
        <Tooltip content={riskDescriptions[option.risk]}>
          <div className="cursor-help">
            <Badge variant={riskColors[option.risk]}>
              <Shield className="mr-1 h-3 w-3" />
              {option.risk}
            </Badge>
          </div>
        </Tooltip>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-black/20 p-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <TrendingUp className="h-3 w-3" />
            APY
            <Tooltip content="Annual Percentage Yield: Estimated yearly returns including compounding.">
              <HelpCircle className="h-3 w-3 cursor-help text-[var(--color-text-dim)] hover:text-[var(--color-text-main)]" />
            </Tooltip>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
            <CountUp 
              end={option.apy} 
              decimals={2} 
              suffix="%" 
              duration={2.5}
              separator=","
            />
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
            <DollarSign className="h-3 w-3" />
            TVL
            <Tooltip content="Total Value Locked: Total assets currently staked in this protocol.">
              <HelpCircle className="h-3 w-3 cursor-help text-[var(--color-text-dim)] hover:text-[var(--color-text-main)]" />
            </Tooltip>
          </div>
          <p className="text-xl font-bold text-[var(--color-text-main)]">
            {option.tvl}
          </p>
        </div>
      </div>

      {/* Action */}
      <Button 
        variant="primary" 
        className={`w-full mt-2 font-semibold shadow-lg shadow-${colors.accent}/10`}
        onClick={() => onStake(option)}
      >
        Stake {option.token}
      </Button>
    </Card>
  );
}
