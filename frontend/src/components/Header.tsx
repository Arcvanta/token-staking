'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Wallet } from 'lucide-react';

export function Header() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-bg-card)]/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="container mx-auto flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="relative h-10 w-10">
            <Image 
              src="/icons/dedlyfi.png" 
              alt="DedlyFi Logo" 
              fill
              sizes="40px"
              className="object-contain"
            />
          </div>
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            DedlyFi
          </span>
        </Link>

        <nav className="flex items-center gap-2 bg-black/20 p-1.5 rounded-xl border border-white/5">
          <Link 
            href="/" 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive('/') 
                ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-blue-500/20' 
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Stake
          </Link>
          <Link 
            href="/positions" 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive('/positions') 
                ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-blue-500/20' 
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] hover:bg-white/5'
            }`}
          >
            <Wallet className="h-4 w-4" />
            My Positions
          </Link>
        </nav>

        <ConnectButton 
          showBalance={false}
          accountStatus={{
            smallScreen: 'avatar',
            largeScreen: 'full',
          }}
        />
      </div>
    </header>
  );
}
