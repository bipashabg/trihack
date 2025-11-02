'use client';

import { useRouter } from 'next/navigation';
import PrismaticBurst from '@/components/PrismaticBurst';
import TextType from '@/components/TextType';
import InfiniteScroll from '@/components/InfiniteScroll';
export default function Home() {

  const items = [
  { content: "USP" },
  { content: <p>Independence to break the loan and borrow from multiple competing pools all with a singe click</p> },
  { content: "Cheaper Loans" },
  { content: <p>Aggregated liquidity which doesn’t compel the user to stick to a particular pool for getting the entire loan and can get receive it from various competing pools at cheaper rates.</p> },
  { content: "Unified Aggregated Liquidity" },
  { content: <p>Liquidity providers can see the entire historical performance of competiting pools to compare their apy based on the kind of irm logic they use and what kind of yield have they generated.</p> },
  { content: "Faster Settlement" },
  ];

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
        <PrismaticBurst
          animationType="rotate3d"
          intensity={2}
          speed={0.5}
          distort={1.0}
          paused={false}
          offset={{ x: 0, y: 0 }}
          hoverDampness={0.25}
          rayCount={24}
          mixBlendMode="lighten"
          colors={['#ff007a', '#4d3dff', '#ffffff']}
        />
        </div>

      {/* Content Overlay */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4">
        <div className="max-w-4xl text-center">
          <h1 className="mb-6 text-6xl font-bold text-white md:text-7xl lg:text-8xl">
            Credix
          </h1>
          <p className="mb-8 text-xl text-gray-200 md:text-2xl">
          The first orderbook-powered lending aggregator that turns fragmented DeFi pools into one organized and unified market, giving borrowers cheaper, smarter, and more efficient loans.
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
      <div style={{height: '500px', position: 'relative', color: 'white', }}>
      <InfiniteScroll
        items={items}
        isTilted={true}
        tiltDirection='left'
        autoplay={true}
        autoplaySpeed={0.1}
        autoplayDirection="down"
        pauseOnHover={true}
      />
    </div>
    </div>
  );
}
