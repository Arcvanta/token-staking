import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Tooltip } from './ui/Tooltip';
import { X, AlertCircle, Wallet, ArrowDownCircle, TrendingUp, Clock, ExternalLink, Calendar, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CountUp from 'react-countup';
import { useProtocolBalance } from '@/hooks/useProtocolBalance';
import { formatUnits } from 'viem';
import { useAccount } from 'wagmi';

interface UnstakingModalProps {
  position: any;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: string) => void;
  isLoading?: boolean;
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
  'SOL': '/icons/solana.png',
};

// Token decimals mapping
const TOKEN_DECIMALS: Record<string, number> = {
  'ETH': 18,
  'WETH': 18,
  'WBTC': 8,
  'USDC': 6,
  'SOL': 9,
};

export function UnstakingModal({ position, isOpen, onClose, onConfirm, isLoading }: UnstakingModalProps) {
  const [amount, setAmount] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { address } = useAccount();
  
  const stakingRouterAddress = process.env.NEXT_PUBLIC_SEPOLIA_STAKING_ROUTER || '';

  // Fetch real on-chain balance
  const { balance: onChainBalance, isLoading: isLoadingBalance } = useProtocolBalance(
    position?.adapterAddress,
    position?.tokenAddress,
    address,
    stakingRouterAddress
  );

  // Calculate position metrics - must be before early return to follow Rules of Hooks
  const metrics = useMemo(() => {
    if (!position) {
      return {
        stakedAmount: 0,
        currentValue: 0,
        totalEarnings: 0,
        percentageGain: 0,
        daysStaked: 0,
        hoursStaked: 0,
        currentAPY: 0,
        dailyEarnings: 0,
        stakedDate: new Date(),
      };
    }

    const stakedAmount = parseFloat(position.amount);
    // Ensure we handle both Date objects and string dates, prioritizing timestamp from backend
    const stakedDate = new Date(position.timestamp || position.createdAt || position.date || Date.now());
    const now = new Date();
    
    // Calculate time difference in milliseconds
    const timeDiff = now.getTime() - stakedDate.getTime();
    const daysStaked = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    // Calculate precise fraction of year for earnings
    const yearsElapsed = timeDiff / (1000 * 60 * 60 * 24 * 365);
    
    // Use position APY if available, otherwise fallback to default
    const currentAPY = position.apy || 5.2; 
    
    // Calculate theoretical earnings based on APY and time
    // Note: In a production system, we would track individual receipt token amounts
    // For now, we use theoretical calculation to avoid showing inflated values
    // from accumulated receipt tokens across multiple stakes
    const totalEarnings = stakedAmount * (currentAPY / 100) * yearsElapsed;
    const currentValue = stakedAmount + totalEarnings;
    
    const dailyEarnings = (stakedAmount * (currentAPY / 100)) / 365;
    const percentageGain = stakedAmount > 0 ? (totalEarnings / stakedAmount) * 100 : 0;
    
    return {
      stakedAmount,
      currentValue,
      totalEarnings,
      percentageGain,
      daysStaked,
      currentAPY,
      dailyEarnings,
      stakedDate,
    };
  }, [position, onChainBalance]);


  if (!position) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !acceptedTerms) return;
    onConfirm(amount);
  };

  const maxAmount = metrics.currentValue || 0;
  const isExceedingBalance = parseFloat(amount) > maxAmount;
  const withdrawAmount = parseFloat(amount) || 0;
  const remainingAmount = maxAmount - withdrawAmount;

  const formatDate = (date: Date) => {
    if (!date || isNaN(date.getTime())) {
      return 'N/A';
    }
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatDuration = (days: number, hours: number) => {
    if (days === 0) return `${hours} hours`;
    if (days === 1) return '1 day';
    return `${days} days`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-2xl my-8"
            >
              <Card className="relative border-amber-500/20">
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-text-main)] z-10"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-white/5 p-1 ring-1 ring-white/10">
                      <Image 
                        src={PROTOCOL_ICONS[position.protocol] || '/icons/dedlyfi.png'} 
                        alt={position.protocol}
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-gray-900 p-0.5 ring-1 ring-black">
                      <Image 
                        src={TOKEN_ICONS[position.token] || '/icons/dedlyfi.png'} 
                        alt={position.token}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="success" className="text-xs">
                        Active
                      </Badge>
                      <h2 className="text-2xl font-bold text-[var(--color-text-main)]">
                        Manage Position
                      </h2>
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      {position.protocol} • {position.token}
                    </p>
                  </div>
                </div>

                {/* Position Overview */}
                <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4 border border-white/5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet className="h-4 w-4 text-[var(--color-text-dim)]" />
                      <span className="text-xs text-[var(--color-text-muted)]">Staked Amount</span>
                      <Tooltip content="The initial amount of tokens you staked in this position.">
                        <Info className="h-3 w-3 text-[var(--color-text-dim)] cursor-help" />
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold text-[var(--color-text-main)] font-mono">
                      <CountUp 
                        end={metrics.stakedAmount} 
                        decimals={6} 
                        duration={1.5}
                        separator=","
                      /> {position.token}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs text-[var(--color-text-muted)]">Current Value</span>
                      <Tooltip content="The total value of your position including accrued earnings.">
                        <Info className="h-3 w-3 text-[var(--color-text-dim)] cursor-help" />
                      </Tooltip>
                    </div>
                    <p className="text-2xl font-bold text-emerald-400 font-mono">
                      <CountUp 
                        end={metrics.currentValue} 
                        decimals={6} 
                        duration={1.5}
                        separator=","
                      /> {position.token}
                    </p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="mb-6 grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="text-xs text-[var(--color-text-muted)]">Total Earnings</span>
                      <Tooltip content="Total rewards earned since staking started. (Simulated for PoC)">
                        <Info className="h-3 w-3 text-[var(--color-text-dim)] cursor-help" />
                      </Tooltip>
                    </div>
                    <p className="text-lg font-bold text-emerald-400 font-mono">
                      +<CountUp 
                        end={metrics.totalEarnings} 
                        decimals={6} 
                        duration={1.5}
                        separator=","
                      /> {position.token}
                    </p>
                    <p className="text-xs text-emerald-400/70 font-mono">
                      +<CountUp 
                        end={metrics.percentageGain} 
                        decimals={2} 
                        suffix="%" 
                        duration={1.5}
                      />
                    </p>
                  </div>

                  <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Clock className="h-3.5 w-3.5 text-blue-400" />
                      <span className="text-xs text-[var(--color-text-muted)]">Time Staked</span>
                      <Tooltip content="Duration since the position was created.">
                        <Info className="h-3 w-3 text-[var(--color-text-dim)] cursor-help" />
                      </Tooltip>
                    </div>
                    <p className="text-lg font-bold text-[var(--color-text-main)] font-mono">
                      <CountUp 
                        end={metrics.daysStaked} 
                        duration={1.5}
                      /> {metrics.daysStaked === 1 ? 'day' : 'days'}
                    </p>
                    <p className="text-xs text-[var(--color-text-dim)]">
                      Since {metrics.stakedDate && !isNaN(metrics.stakedDate.getTime()) ? formatDate(metrics.stakedDate).split(',')[0] : 'N/A'}
                    </p>
                  </div>

                  <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="h-3.5 w-3.5 text-purple-400" />
                      <span className="text-xs text-[var(--color-text-muted)]">Current APY</span>
                      <Tooltip content="Annual Percentage Yield. This is a simulated rate for demonstration purposes.">
                        <Info className="h-3 w-3 text-[var(--color-text-dim)] cursor-help" />
                      </Tooltip>
                    </div>
                    <p className="text-lg font-bold text-purple-400 font-mono">
                      <CountUp 
                        end={metrics.currentAPY} 
                        decimals={2} 
                        suffix="%" 
                        duration={1.5}
                      />
                    </p>
                    <p className="text-xs text-[var(--color-text-dim)] font-mono">
                      ~<CountUp 
                        end={metrics.dailyEarnings} 
                        decimals={6} 
                        duration={1.5}
                      />/day
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Withdraw Amount Input */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-[var(--color-text-main)]">
                        Amount to Withdraw
                      </label>
                      <button
                        type="button"
                        onClick={() => setAmount(maxAmount.toString())}
                        className="text-xs text-[var(--color-primary)] hover:underline"
                      >
                        Max: {maxAmount ? maxAmount.toFixed(6) : '0.000000'}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.000001"
                        min="0"
                        max={maxAmount}
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className={`w-full rounded-lg border ${
                          isExceedingBalance 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20'
                        } bg-[var(--color-bg-card)] px-4 py-3 text-lg text-[var(--color-text-main)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Badge variant="neutral">{position.token}</Badge>
                      </div>
                    </div>
                    {isExceedingBalance && (
                      <p className="mt-1 text-xs text-red-400">
                        Exceeds available balance
                      </p>
                    )}
                  </div>

                  {/* Withdrawal Impact */}
                  {withdrawAmount > 0 && !isExceedingBalance && (
                    <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
                      <div className="flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                          <p className="text-sm font-medium text-blue-400">
                            Withdrawal Impact
                          </p>
                          <div className="space-y-1 text-xs text-[var(--color-text-muted)]">
                            <div className="flex justify-between">
                              <span>Withdrawing:</span>
                              <span className="font-mono text-[var(--color-text-main)]">{withdrawAmount.toFixed(6)} {position.token}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Remaining staked:</span>
                              <span className="font-mono text-[var(--color-text-main)]">{remainingAmount.toFixed(6)} {position.token}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Future daily earnings:</span>
                              <span className="font-mono text-emerald-400">
                                ~{(remainingAmount * (metrics.currentAPY / 100) / 365).toFixed(6)} {position.token}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Important Information */}
                  <div className="rounded-lg bg-amber-500/10 p-4 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <p className="text-sm font-semibold text-amber-400">
                          Important Information
                        </p>
                        <ul className="space-y-1 text-xs text-amber-400/80">
                          <li>• Withdrawal may take up to 24-48 hours depending on the protocol</li>
                          <li>• You will stop earning rewards on the withdrawn amount immediately</li>
                          <li>• Gas fees will apply for the withdrawal transaction</li>
                          <li>• Partial withdrawals are supported - you can withdraw any amount</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="rounded-lg bg-white/5 p-3 border border-white/5">
                    <div className="flex items-center gap-2 mb-2">
                      <ExternalLink className="h-3.5 w-3.5 text-[var(--color-text-dim)]" />
                      <span className="text-xs font-medium text-[var(--color-text-muted)]">Transaction Details</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-dim)]">Original Stake TX:</span>
                        <a 
                          href={`https://sepolia.etherscan.io/tx/${position.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-[var(--color-primary)] hover:underline flex items-center gap-1"
                        >
                          {position.txHash?.slice(0, 6)}...{position.txHash?.slice(-4)}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-dim)]">Stake Date:</span>
                        <span className="font-mono text-[var(--color-text-main)]">{formatDate(metrics.stakedDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[var(--color-text-dim)]">Network:</span>
                        <span className="font-mono text-[var(--color-text-main)]">Sepolia Testnet</span>
                      </div>
                    </div>
                  </div>

                  {/* Terms Acceptance */}
                  <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-black/20 p-3">
                    <div className="flex h-5 items-center">
                      <input
                        id="unstake-terms"
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="h-4 w-4 rounded border-white/10 bg-white/5 text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-0"
                      />
                    </div>
                    <label htmlFor="unstake-terms" className="text-xs text-[var(--color-text-muted)]">
                      I understand that withdrawing will stop earning rewards on the withdrawn amount and that this action cannot be undone without re-staking.
                    </label>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={onClose}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      className="flex-1 bg-amber-600 hover:bg-amber-700 border-amber-500"
                      isLoading={isLoading}
                      disabled={!amount || parseFloat(amount) <= 0 || isExceedingBalance || !acceptedTerms}
                    >
                      {isLoading ? 'Processing...' : 'Confirm Withdrawal'}
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
