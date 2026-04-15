'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { StakingCard } from '@/components/StakingCard';
import { StakingModal } from '@/components/StakingModal';
import { useStakingOptions, StakingOption } from '@/hooks/useStakingOptions';
import { useStake } from '@/hooks/useStake';
import { Loader2, AlertCircle, ExternalLink, Sparkles } from 'lucide-react';
import { useAccount } from 'wagmi';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import { logger } from '@/utils/logger';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { data: options, isLoading, error } = useStakingOptions('sepolia');
  const [selectedOption, setSelectedOption] = useState<StakingOption | null>(null);
  const { stake, currentStep, error: stakeError, txHash, reset, isLoading: isStaking } = useStake();

  const handleStake = (option: StakingOption) => {
    if (!isConnected) {
      toast.error('Please connect your wallet first', {
        icon: '🔒',
        style: {
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#f87171',
          border: '1px solid #ef4444',
        },
      });
      return;
    }
    reset(); // Reset previous state
    setSelectedOption(option);
  };

  const handleConfirmStake = async (amount: string) => {
    if (!selectedOption || !address) return;

    try {
      const tx = await stake(selectedOption, amount);

      // 🎉 Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#60a5fa', '#a78bfa', '#10b981', '#f59e0b'],
      });

      // Show success toast with crypto styling
      toast.success(
        (t) => (
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-emerald-400 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-400">Stake Successful!</p>
              <p className="text-sm text-gray-300 mt-1">
                {amount} {selectedOption.token} staked on {selectedOption.protocol}
              </p>
              <a
                href={`https://sepolia.etherscan.io/tx/${tx}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mt-2 transition-colors"
              >
                View on Etherscan <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ),
        {
          duration: 7000,
          style: {
            background: 'linear-gradient(135deg, #064e3b 0%, #022c22 100%)',
            border: '1px solid #10b981',
            padding: '16px',
          },
        }
      );
      logger.info('Stake successful td: ' + tx, { service: 'stake', method: 'handleConfirmStake' });

      setSelectedOption(null);
    } catch (error: any) {
      logger.error('Staking failed: ' + error, { service: 'stake', method: 'handleConfirmStake' });
      toast.error(
        error?.message || 'Failed to stake. Please try again.',
        {
          icon: '❌',
          style: {
            background: 'linear-gradient(135deg, #7f1d1d 0%, #450a0a 100%)',
            color: '#fca5a5',
            border: '1px solid #ef4444',
          },
        }
      );
    }
  };

  // Group options by token
  const groupedOptions = options?.reduce((acc, option) => {
    if (!acc[option.token]) {
      acc[option.token] = [];
    }
    acc[option.token].push(option);
    return acc;
  }, {} as Record<string, StakingOption[]>);

  return (
    <>
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-[var(--color-text-main)] md:text-5xl">
            Stake Your Assets{' '}
            <span className="text-gradient">Securely</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[var(--color-text-muted)]">
            Access the best yields in DeFi with our curated staking options.
            Simple, secure, and transparent.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mx-auto max-w-md rounded-lg bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5" />
              <div>
                <p className="font-medium text-red-400">Failed to load staking options</p>
                <p className="mt-1 text-sm text-red-400/80">
                  Please check your connection and try again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Staking Options */}
        {groupedOptions && Object.keys(groupedOptions).length > 0 && (
          <div className="space-y-8">
            {Object.entries(groupedOptions).map(([token, tokenOptions]) => (
              <div key={token} className="animate-fade-in">
                <h2 className="mb-4 text-2xl font-bold text-[var(--color-text-main)]">
                  {token} Staking Options
                </h2>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {tokenOptions.map((option) => (
                    <StakingCard
                      key={option.id}
                      option={option}
                      onStake={handleStake}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && (!options || options.length === 0) && (
          <div className="py-12 text-center">
            <p className="text-[var(--color-text-muted)]">
              No staking options available at the moment.
            </p>
          </div>
        )}
      </main>

      {/* Staking Modal */}
      <StakingModal
        option={selectedOption}
        isOpen={!!selectedOption}
        onClose={() => setSelectedOption(null)}
        onConfirm={handleConfirmStake}
        isLoading={isStaking}
        currentStep={currentStep}
      />
    </>
  );
}
