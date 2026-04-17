'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { Tooltip } from './ui/Tooltip';
import { X, AlertCircle, TrendingUp, Wallet } from 'lucide-react';
import { StakingOption } from '@/hooks/useStakingOptions';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { LoadingAnimation } from './LoadingAnimation';
import { motion, AnimatePresence } from 'framer-motion';

interface StakingModalProps {
  option: StakingOption | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: string) => void;
  isLoading?: boolean;
  currentStep?: 'idle' | 'approving' | 'staking' | 'success' | 'error';
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

export function StakingModal({ option, isOpen, onClose, onConfirm, isLoading, currentStep = 'idle' }: StakingModalProps) {
  const [amount, setAmount] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const { balance, isLoading: balanceLoading } = useTokenBalance(option?.token || '');

  if (!option) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    const balanceNum = parseFloat(balance);
    
    if (!amount || amountNum <= 0) {
      return;
    }
    
    if (amountNum > balanceNum) {
      return;
    }
    
    onConfirm(amount);
  };

  const estimatedReturns = amount ? (parseFloat(amount) * option.apy / 100).toFixed(4) : '0';
  const isInsufficientBalance = parseFloat(amount) > parseFloat(balance);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md"
            >
              <Card className="relative">
                {/* Close Button - Hidden during loading */}
                {!isLoading && (
                  <button
                    onClick={onClose}
                    className="absolute right-4 top-4 rounded-lg p-2 text-[var(--color-text-muted)] transition-colors hover:bg-white/5 hover:text-[var(--color-text-main)]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}

                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                  <div className="relative h-16 w-16 flex-shrink-0">
                    <div className="h-16 w-16 overflow-hidden rounded-full bg-white/5 p-1 ring-1 ring-white/10">
                      <Image 
                        src={PROTOCOL_ICONS[option.protocol] || '/icons/dedlyfi.png'} 
                        alt={option.protocol}
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-gray-900 p-0.5 ring-1 ring-black">
                      <Image 
                        src={TOKEN_ICONS[option.token] || '/icons/dedlyfi.png'} 
                        alt={option.token}
                        width={32}
                        height={32}
                        className="object-contain"
                      />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-[var(--color-text-main)]">
                      Stake {option.token}
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      on {option.protocol}
                    </p>
                  </div>
                </div>

                {/* Loading State */}
                {isLoading ? (
                  <LoadingAnimation 
                    tokenIcon={TOKEN_ICONS[option.token] || '/icons/dedlyfi.png'}
                    message={
                      currentStep === 'approving' 
                        ? `Approving ${option.token}...`
                        : currentStep === 'staking'
                        ? `Staking ${option.token}...`
                        : 'Processing transaction...'
                    }
                    submessage={
                      currentStep === 'approving'
                        ? `You're authorizing the smart contract to access your ${option.token}. This is a one-time approval for unlimited amount (standard DeFi practice).`
                        : currentStep === 'staking'
                        ? `Now staking your ${option.token} on ${option.protocol}. Your tokens will be deposited and you'll receive receipt tokens representing your position.`
                        : 'Please wait while we confirm your transaction on the blockchain'
                    }
                  />
                ) : (
                  /* Form */
                  <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Balance Display */}
                  <div className="flex items-center justify-between rounded-lg bg-[var(--color-bg-card)] p-3">
                    <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                      <Wallet className="h-4 w-4" />
                      <span>Your Balance</span>
                    </div>
                    <div className="text-sm font-semibold text-[var(--color-text-main)]">
                      {balanceLoading ? '...' : `${balance} ${option.token}`}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[var(--color-text-main)]">
                      Amount
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.000001"
                        min="0"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className={`w-full rounded-lg border ${
                          isInsufficientBalance 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/20'
                        } bg-[var(--color-bg-card)] px-4 py-3 text-lg text-[var(--color-text-main)] placeholder:text-[var(--color-text-dim)] focus:outline-none focus:ring-2`}
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Badge variant="neutral">{option.token}</Badge>
                      </div>
                    </div>
                    {isInsufficientBalance && amount && (
                      <p className="mt-1 text-xs text-red-400">
                        Insufficient balance
                      </p>
                    )}
                  </div>

                  {/* Info Box */}
                  <div className="rounded-lg bg-blue-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <TrendingUp className="h-5 w-5 text-blue-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-400">
                          Estimated Annual Returns
                        </p>
                        <p className="mt-1 text-2xl font-bold text-[var(--color-text-main)]">
                          {estimatedReturns} {option.token}
                        </p>
                        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                          Based on {option.apy.toFixed(2)}% APY
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Fee Breakdown */}
                  {amount && parseFloat(amount) > 0 && (
                    <div className="rounded-lg bg-white/5 p-3 text-sm space-y-2">
                      <div className="flex justify-between text-[var(--color-text-muted)]">
                        <span>Amount</span>
                        <span>{parseFloat(amount).toFixed(6)} {option.token}</span>
                      </div>
                      <div className="flex justify-between text-amber-400">
                        <div className="flex items-center gap-1">
                          <span>Platform Fee (1%)</span>
                          <Tooltip content="Fees support the platform development and are sent to the treasury wallet.">
                            <AlertCircle className="h-3 w-3 cursor-help" />
                          </Tooltip>
                        </div>
                        <span>-{(parseFloat(amount) * 0.01).toFixed(6)} {option.token}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-2 font-bold text-[var(--color-text-main)]">
                        <span>Net Staked</span>
                        <span>{(parseFloat(amount) * 0.99).toFixed(6)} {option.token}</span>
                      </div>
                      <p className="text-[10px] text-[var(--color-text-dim)] text-right font-mono mt-1">
                        Treasury: 0x...264D
                      </p>
                    </div>
                  )}

                  {/* Warning */}
                  <div className="rounded-lg bg-amber-500/10 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-400 mt-0.5" />
                      <p className="text-xs text-amber-400">
                        Make sure you have enough {option.token} in your wallet and sufficient ETH for gas fees.
                      </p>
                    </div>
                  </div>

                  {/* Educational Info */}
                  <div className="rounded-lg bg-blue-500/5 border border-blue-500/10 p-4 space-y-3">
                    <div className="flex items-center gap-2 text-blue-400">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                      <p className="text-xs font-semibold uppercase tracking-wider">What you are signing</p>
                    </div>
                    
                    <div className="space-y-2 text-xs text-[var(--color-text-muted)]">
                      <div className="flex gap-2">
                        <span className="font-mono text-[var(--color-text-main)]">1. Approve:</span>
                        <p>Permission for the smart contract to use your {option.token}. This is a one-time security measure.</p>
                      </div>
                      <div className="flex gap-2">
                        <span className="font-mono text-[var(--color-text-main)]">2. Stake:</span>
                        <p>The actual deposit of your tokens into the {option.protocol} protocol to start earning rewards.</p>
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer */}
                  <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-black/20 p-3">
                    <div className="flex h-5 items-center">
                      <input
                        id="terms"
                        type="checkbox"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="h-4 w-4 rounded border-white/10 bg-white/5 text-[var(--color-primary)] focus:ring-[var(--color-primary)] focus:ring-offset-0"
                      />
                    </div>
                    <label htmlFor="terms" className="text-xs text-[var(--color-text-muted)]">
                      I accept the <span className="text-[var(--color-primary)] hover:underline cursor-pointer">Terms of Service</span> and understand that staking involves risk, including potential loss of funds due to smart contract failure or market volatility.
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
                      className="flex-1"
                      isLoading={isLoading}
                      disabled={!amount || parseFloat(amount) <= 0 || isInsufficientBalance || !acceptedTerms}
                    >
                      Confirm Stake
                    </Button>
                  </div>
                </form>
                )}
              </Card>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
