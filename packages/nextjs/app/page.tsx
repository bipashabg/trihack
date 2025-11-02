'use client';

import { useRouter } from 'next/navigation';
import Silk from '@/components/Silk';

export default function Home() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/borrower'); 
  };

  const handleLend = () => {
    router.push('/lender'); 
  };

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-black">
      <div className="absolute inset-0">
        <Silk
          speed={5}
          scale={1}
          color="#7B7481"
          noiseIntensity={1.5}
          rotation={0}
        />
        </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div className="max-w-4xl text-center">
          <h1 className="mb-6 text-6xl font-bold text-white md:text-7xl lg:text-8xl">
            CredBook
          </h1>
          <p className="mb-8 text-xl text-gray-200 md:text-2xl">
            On-chain orderbook for DeFi lending - matching borrowers with the best rates across competing liquidity pools.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <button
              onClick={handleGetStarted}
              className="rounded-lg bg-white/20 px-8 py-4 text-lg font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-105"
            >
              Borrow
            </button>

            <button
              onClick={handleLend}
              className="rounded-lg bg-white/20 px-8 py-4 text-lg font-medium text-white backdrop-blur-sm transition-all hover:bg-white/30 hover:scale-105"
            >
              Lend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
