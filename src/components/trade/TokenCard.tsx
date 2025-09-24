import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Token } from '@shared/types';
interface TokenCardProps {
  token: Token;
}
const formatCurrency = (value: number) => {
  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(2)}B`;
  }
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`;
  }
  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(2)}K`;
  }
  return `$${value.toFixed(2)}`;
};
export function TokenCard({ token }: TokenCardProps) {
  const isPositiveChange = token.change24h >= 0;
  return (
    <motion.div
      className="absolute w-full h-full bg-blaze-white border-2 border-blaze-black p-6 flex flex-col justify-between overflow-hidden cursor-grab active:cursor-grabbing"
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <img src={token.logoUrl} alt={token.name} className="w-16 h-16" />
          <div>
            <h2 className="font-display text-5xl font-bold">{token.symbol}</h2>
            <p className="font-mono text-lg text-blaze-black/70">{token.name}</p>
          </div>
        </div>
        <div className={`flex items-center font-mono font-bold text-2xl ${isPositiveChange ? 'text-green-600' : 'text-red-600'}`}>
          {isPositiveChange ? <TrendingUp className="w-6 h-6 mr-1" /> : <TrendingDown className="w-6 h-6 mr-1" />}
          {token.change24h.toFixed(2)}%
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-lg text-blaze-black/70">Price</p>
        <h3 className="font-mono font-bold text-6xl tracking-tighter">${token.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 })}</h3>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="font-mono text-lg text-blaze-black/70">Market Cap</p>
          <p className="font-mono font-bold text-3xl">{formatCurrency(token.marketCap)}</p>
        </div>
        <div className="font-mono uppercase text-center">
          <p className="text-lg font-bold">↑</p>
          <p className="tracking-widest">Watchlist</p>
        </div>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 left-4 -translate-x-full opacity-0 transition-opacity text-blaze-black/50 text-center" data-card-action="skip">
        <p className="font-display text-6xl font-bold">SKIP</p>
      </div>
      <div className="absolute top-1/2 -translate-y-1/2 right-4 translate-x-full opacity-0 transition-opacity text-blaze-black/50 text-center" data-card-action="buy">
        <p className="font-display text-6xl font-bold">BUY</p>
      </div>
    </motion.div>
  );
}