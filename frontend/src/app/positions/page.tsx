'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { UnstakingModal } from '@/components/UnstakingModal';
import { toast } from 'sonner';
import { useAccount } from 'wagmi';
import { useQuery } from '@tanstack/react-query';
import { Loader2, TrendingUp, Clock, ExternalLink, Wallet, ArrowDownCircle, DollarSign, ArrowUpDown, Calendar, Percent, Layers } from 'lucide-react';
import { useStakingOptions } from '@/hooks/useStakingOptions';
import { useUnstake } from '@/hooks/useUnstake';
import { usePrices } from '@/hooks/usePrices';
import CountUp from 'react-countup';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4001';

interface Transaction {
  _id: string;
  userAddress: string;
  protocol: string;
  token: string;
  tokenAddress: string;
  adapterAddress: string;
  amount: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  apy?: number;
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

async function fetchUserTransactions(address: string): Promise<Transaction[]> {
  const response = await fetch(`${API_URL}/api/transactions/${address}`);
  if (!response.ok) throw new Error('Failed to fetch transactions');
  return response.json();
}

export default function PositionsPage() {
  const { address, isConnected } = useAccount();
  const [selectedPosition, setSelectedPosition] = useState<Transaction | null>(null);
  const [isUnstakeModalOpen, setIsUnstakeModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'apy' | 'amount' | 'protocol'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  const { data: options } = useStakingOptions(); // To get current APY info
  
  const { data: transactions, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions', address],
    queryFn: () => fetchUserTransactions(address!),
    enabled: !!address,
    refetchInterval: 5000, // Refetch every 5 seconds to catch status updates
  });

  // Get unique tokens from transactions for price fetching
  const uniqueTokens = transactions 
    ? Array.from(new Set(transactions.map(tx => tx.token)))
    : [];
  
  const { prices, isLoading: isPricesLoading } = usePrices(uniqueTokens);

  // Calculate portfolio total in USD
  const portfolioTotal = transactions?.reduce((total, tx) => {
    const amount = parseFloat(tx.amount);
    const price = prices[tx.token] || 0;
    return total + (amount * price);
  }, 0) || 0;

  const { unstake, isLoading: isUnstaking } = useUnstake();

  const handleUnstakeConfirm = async (amount: string) => {
    if (!selectedPosition) return;
    
    try {
      await unstake(selectedPosition, amount);
      
      toast.success('Unstake successful!', {
        description: `Successfully unstaked ${amount} ${selectedPosition.token} from ${selectedPosition.protocol}`
      });
      
      setIsUnstakeModalOpen(false);
      refetch();
    } catch (error: any) {
      toast.error('Unstake failed', {
        description: error.message || 'Please try again'
      });
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getApyForProtocol = (protocol: string, token: string) => {
    if (!options) return 0;
    const option = options.find((o) => o.protocol === protocol && o.token === token);
    return option ? option.apy : 0;
  };

  // Sorting Logic
  const getSortedTransactions = () => {
    if (!transactions) return [];
    
    return [...transactions].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
          break;
        case 'apy':
          const apyA = getApyForProtocol(a.protocol, a.token);
          const apyB = getApyForProtocol(b.protocol, b.token);
          comparison = apyB - apyA;
          break;
        case 'amount':
          const valA = parseFloat(a.amount) * (prices[a.token] || 0);
          const valB = parseFloat(b.amount) * (prices[b.token] || 0);
          comparison = valB - valA;
          break;
        case 'protocol':
          comparison = a.protocol.localeCompare(b.protocol);
          break;
      }
      
      return sortOrder === 'asc' ? -comparison : comparison; // Default desc for date/amount/apy
    });
  };

  const sortedTransactions = getSortedTransactions();

  // Toggle sort helper
  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  if (!isConnected) {
    return (
      <>
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 rounded-full bg-white/5 p-6 ring-1 ring-white/10">
              <Wallet className="h-12 w-12 text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-2xl font-bold text-[var(--color-text-main)]">Connect your wallet</h2>
            <p className="mt-2 text-[var(--color-text-muted)]">
              Please connect your wallet to view your active positions and staking history.
            </p>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-main)]">
              My Positions
            </h1>
            <p className="text-[var(--color-text-muted)] mt-2">
              Track your active stakes and earnings
            </p>
          </div>
          
          {/* Sorting Controls */}
          {transactions && transactions.length > 0 && (
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/10">
              <button
                onClick={() => toggleSort('date')}
                className={`p-2 rounded-md transition-colors ${sortBy === 'date' ? 'bg-white/10 text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
                title="Sort by Date"
              >
                <Calendar className="h-4 w-4" />
              </button>
              <button
                onClick={() => toggleSort('amount')}
                className={`p-2 rounded-md transition-colors ${sortBy === 'amount' ? 'bg-white/10 text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
                title="Sort by Value"
              >
                <DollarSign className="h-4 w-4" />
              </button>
              <button
                onClick={() => toggleSort('apy')}
                className={`p-2 rounded-md transition-colors ${sortBy === 'apy' ? 'bg-white/10 text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
                title="Sort by APY"
              >
                <Percent className="h-4 w-4" />
              </button>
              <button
                onClick={() => toggleSort('protocol')}
                className={`p-2 rounded-md transition-colors ${sortBy === 'protocol' ? 'bg-white/10 text-[var(--color-primary)]' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]'}`}
                title="Sort by Protocol"
              >
                <Layers className="h-4 w-4" />
              </button>
              <div className="w-px h-4 bg-white/10 mx-1" />
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                <ArrowUpDown className={`h-4 w-4 transition-transform ${sortOrder === 'asc' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Portfolio Total Card */}
        {transactions && transactions.length > 0 && (
          <Card className="mb-6 bg-gradient-to-br from-[var(--color-primary)]/10 to-purple-500/10 border-[var(--color-primary)]/20">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)] mb-1">
                  <DollarSign className="h-4 w-4" />
                  <span>Total Portfolio Value</span>
                </div>
                <div className="text-3xl font-bold text-[var(--color-text-main)]">
                  {isPricesLoading ? (
                    <span className="text-[var(--color-text-muted)]">Loading...</span>
                  ) : (
                    <>
                      $<CountUp 
                        end={portfolioTotal} 
                        decimals={2} 
                        duration={2.5}
                        separator=","
                      /> <span className="text-lg text-[var(--color-text-muted)]">USDC</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-dim)] mt-1">
                  Across {transactions.length} position{transactions.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <div className="h-12 w-12 rounded-full bg-[var(--color-primary)]/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-[var(--color-primary)]" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary)]" />
          </div>
        )}

        {error && (
          <Card className="bg-red-500/10 border-red-500/20 p-6 text-center">
            <p className="text-red-400">Failed to load positions. Please try again later.</p>
          </Card>
        )}

        {transactions && transactions.length === 0 && (
          <Card className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-white/5 p-4">
              <TrendingUp className="h-8 w-8 text-[var(--color-text-muted)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-main)]">No positions yet</h3>
            <p className="mt-1 max-w-sm text-sm text-[var(--color-text-muted)]">
              Start staking your assets to earn rewards and track them here.
            </p>
            <Button 
              variant="primary" 
              className="mt-6"
              onClick={() => window.location.href = '/'}
            >
              Explore Staking Options
            </Button>
          </Card>
        )}

        {transactions && transactions.length > 0 && (
          <div className="grid gap-4">
            {sortedTransactions.map((tx) => {
              const currentApy = getApyForProtocol(tx.protocol, tx.token);
              
              return (
                <Card key={tx._id} hoverEffect className="group relative overflow-hidden transition-all duration-300">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    
                    {/* Left: Icon & Main Info */}
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 flex-shrink-0">
                        <div className="h-12 w-12 overflow-hidden rounded-full bg-white/5 p-1 ring-1 ring-white/10">
                          <Image 
                            src={PROTOCOL_ICONS[tx.protocol] || '/icons/dedlyfi.png'} 
                            alt={tx.protocol}
                            width={48}
                            height={48}
                            className="object-contain"
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gray-900 p-0.5 ring-1 ring-black">
                          <Image 
                            src={TOKEN_ICONS[tx.token] || '/icons/dedlyfi.png'} 
                            alt={tx.token}
                            width={24}
                            height={24}
                            className="object-contain"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-bold text-[var(--color-text-main)]">
                            {tx.amount} {tx.token}
                          </h3>
                          <Badge variant={
                            tx.status === 'confirmed' ? 'success' : 
                            tx.status === 'pending' ? 'warning' : 
                            'error'
                          } className="capitalize">
                            {tx.status}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text-muted)]">
                          {tx.protocol}
                        </p>
                      </div>
                    </div>

                    {/* Middle: Stats */}
                    <div className="flex items-center gap-8 border-t border-white/5 pt-4 sm:border-0 sm:pt-0">
                      <div className="flex flex-col">
                        <span className="text-xs text-[var(--color-text-muted)]">Current APY</span>
                        <span className="font-mono text-lg font-bold text-emerald-400">
                          {currentApy > 0 ? (
                            <CountUp 
                              end={currentApy} 
                              decimals={2} 
                              suffix="%" 
                              duration={2.5}
                              separator=","
                            />
                          ) : '-'}
                        </span>
                      </div>
                      
                      <div className="flex flex-col">
                        {/* Label removed as requested */}
                        <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
                          <Clock className="h-3.5 w-3.5 text-[var(--color-text-dim)]" />
                          {tx.timestamp ? formatDate(tx.timestamp) : 'Just now'}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Value in USD/Token */}
                    <div className="flex flex-col items-end gap-1 border-t border-white/5 pt-4 sm:border-0 sm:pt-0">
                      <div className="text-right">
                        <div className="text-lg font-bold text-[var(--color-text-main)]">
                          {prices[tx.token] ? (
                            <>
                              $<CountUp 
                                end={parseFloat(tx.amount) * prices[tx.token]}
                                decimals={2}
                                duration={1.5}
                                separator=","
                              /> <span className="text-sm text-[var(--color-text-muted)]">USDC</span>
                            </>
                          ) : (
                            <span className="text-[var(--color-text-muted)]">-</span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--color-text-dim)]">
                          {tx.amount} {tx.token}
                        </div>
                      </div>
                    </div>

                    {/* Right: Icon Actions */}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedPosition({ ...tx, apy: currentApy });
                          setIsUnstakeModalOpen(true);
                        }}
                        className="group relative h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 hover:from-blue-500/20 hover:to-purple-500/20 hover:border-blue-400/50 transition-all duration-300 flex items-center justify-center"
                        title="Manage Position"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-blue-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 rounded-lg" />
                        <ArrowDownCircle className="relative h-4 w-4 text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
                      </button>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 w-10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-main)]"
                        title="View on Etherscan"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <UnstakingModal
        position={selectedPosition}
        isOpen={isUnstakeModalOpen}
        onClose={() => setIsUnstakeModalOpen(false)}
        onConfirm={handleUnstakeConfirm}
        isLoading={isUnstaking}
      />
    </>
  );
}
