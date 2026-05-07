import { Providers } from "./providers";
import "./globals.css";
import '@rainbow-me/rainbowkit/styles.css';
import { Metadata, Viewport } from "next";
import { Toaster } from 'sonner';
import { UserAuthProvider } from '@/components/UserAuthProvider';


export const viewport: Viewport = {
  themeColor: "#0a0e27",
};

export const metadata: Metadata = {
  title: "DedlyFi | Premium Staking",
  description: "Stake your assets securely with the best yields in DeFi.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[var(--color-bg-main)] text-[var(--color-text-main)] antialiased selection:bg-blue-500/30">
        <Providers>
          <UserAuthProvider />
          <div className="relative flex min-h-screen flex-col">
            {/* Background Gradients */}
            <div className="fixed inset-0 z-[-1] pointer-events-none">
              <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px]" />
            </div>
            
            {children}
          </div>
          <Toaster position="top-right" richColors />
        </Providers>
      </body>
    </html>
  );
}
