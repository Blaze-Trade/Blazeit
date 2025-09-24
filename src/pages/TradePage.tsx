import React, { useState, useMemo, useEffect } from 'react';
import TinderCard from 'react-tinder-card';
import { TokenCard } from '@/components/trade/TokenCard';
import type { Token } from '@shared/types';
import { Button } from '@/components/ui/button';
import { X, Heart, ArrowUp, Loader2, Wallet, Swords } from 'lucide-react';
import { api } from '@/lib/api-client';
import { Toaster, toast } from '@/components/ui/sonner';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { Link } from 'react-router-dom';
import { useAptos } from '@/hooks/useAptos';
type SwipeDirection = 'left' | 'right' | 'up';
export function TradePage() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [initialTokens, setInitialTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isConnected, address, buyToken, addToWatchlist, activeQuest, exitQuestMode } = usePortfolioStore();
  const { simulateTransaction } = useAptos();
  const isInQuestMode = activeQuest !== null;
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api<{ items: Token[] }>('/api/tokens');
        setTokens(data.items);
        setInitialTokens(data.items);
      } catch (err) {
        setError("Failed to fetch tokens. Please try again later.");
        toast.error("Failed to fetch tokens.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTokens();
  }, []);
  const childRefs = useMemo(() => Array(initialTokens.length).fill(0).map(() => React.createRef<any>()), [initialTokens]);
  const restoreCard = (tokenId: string) => {
    const index = initialTokens.findIndex(t => t.id === tokenId);
    if (childRefs[index] && childRefs[index].current) {
      childRefs[index].current.restoreCard();
    }
  };
  const swiped = async (direction: SwipeDirection, token: Token) => {
    if (!isConnected || !address) {
      toast.error("Please connect your wallet to trade.");
      restoreCard(token.id);
      return;
    }
    if (direction === 'right') {
      if (isInQuestMode && activeQuest) {
        try {
          await simulateTransaction(`Buying 1 ${token.symbol}`);
          await api(`/api/quests/${activeQuest.id}/buy`, {
            method: 'POST',
            body: JSON.stringify({ userId: address, token, quantity: 1 }),
          });
          toast.success(`Added 1 ${token.symbol} to Quest Portfolio`);
        } catch (error) {
          restoreCard(token.id);
        }
      } else {
        buyToken(token, 1);
        toast.success(`Bought 1 ${token.symbol}`);
      }
    } else if (direction === 'up') {
      addToWatchlist(token);
      toast.info(`${token.symbol} added to watchlist`);
    }
  };
  const outOfFrame = (name: string) => {
    setTokens(prevTokens => prevTokens.filter(t => t.name !== name));
  };
  const swipe = async (dir: SwipeDirection) => {
    const cardsLeft = tokens;
    if (cardsLeft.length > 0) {
      const toBeRemoved = cardsLeft[cardsLeft.length - 1];
      const index = initialTokens.findIndex(t => t.id === toBeRemoved.id);
      if (childRefs[index] && childRefs[index].current) {
        await childRefs[index].current.swipe(dir);
      }
    }
  };
  const renderContent = () => {
    if (loading) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blaze-white border-2 border-blaze-black p-6 text-center">
          <Loader2 className="w-16 h-16 animate-spin" />
          <p className="font-mono text-lg mt-4">Loading Tokens...</p>
        </div>
      );
    }
    if (error) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blaze-white border-2 border-blaze-black p-6 text-center">
          <h2 className="font-display text-4xl font-bold text-red-600">ERROR</h2>
          <p className="font-mono text-lg mt-2">{error}</p>
        </div>
      );
    }
    if (!isConnected) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blaze-white border-2 border-blaze-black p-6 text-center">
            <Wallet className="w-24 h-24" />
            <h2 className="font-display text-4xl font-bold mt-4">CONNECT WALLET</h2>
            <p className="font-mono text-lg mt-2">Please connect your wallet to start trading.</p>
        </div>
      );
    }
    if (tokens.length === 0) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-blaze-white border-2 border-blaze-black p-6 text-center">
          <h2 className="font-display text-4xl font-bold">ALL SWIPED</h2>
          <p className="font-mono text-lg mt-2">Check back later for more tokens.</p>
        </div>
      );
    }
    return initialTokens.map((token, index) => {
      if (!tokens.find(t => t.id === token.id)) return null;
      return (
        <TinderCard
          ref={childRefs[index]}
          className="absolute w-full h-full"
          key={token.id}
          onSwipe={(dir) => swiped(dir as SwipeDirection, token)}
          onCardLeftScreen={() => outOfFrame(token.name)}
          preventSwipe={['down']}
        >
          <TokenCard token={token} />
        </TinderCard>
      );
    });
  };
  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative p-4">
      <Toaster richColors closeButton />
      {isInQuestMode && activeQuest && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-blaze-orange border-b-2 border-blaze-black p-2 text-center font-mono font-bold z-10 flex items-center justify-between">
          <Link to={`/quests/${activeQuest.id}`} className="flex items-center justify-center gap-2 text-blaze-black flex-grow">
            <Swords className="w-5 h-5" />
            QUEST MODE: {activeQuest.name}
          </Link>
          <Button onClick={exitQuestMode} variant="ghost" size="sm" className="text-blaze-black hover:bg-blaze-black/10 rounded-none">
            <X className="w-5 h-5" />
          </Button>
        </div>
      )}
      <div className="w-full max-w-md h-[60vh] max-h-[600px] relative mt-8 shadow-blaze-shadow">
        {renderContent()}
      </div>
      <div className="flex items-center justify-center gap-4 mt-8">
        <Button onClick={() => swipe('left')} disabled={tokens.length === 0 || loading || !isConnected} className="h-20 w-20 rounded-full border-2 border-blaze-black bg-blaze-white text-blaze-black hover:bg-blaze-black/10 active:bg-blaze-black/20 disabled:opacity-50">
          <X className="w-12 h-12" />
        </Button>
        <Button onClick={() => swipe('up')} disabled={tokens.length === 0 || loading || !isConnected} className="h-20 w-20 rounded-full border-2 border-blaze-black bg-blaze-white text-blaze-black hover:bg-blaze-black/10 active:bg-blaze-black/20 disabled:opacity-50">
          <ArrowUp className="w-12 h-12" />
        </Button>
        <Button onClick={() => swipe('right')} disabled={tokens.length === 0 || loading || !isConnected} className="h-20 w-20 rounded-full border-2 border-blaze-orange bg-blaze-orange text-blaze-black hover:bg-blaze-orange/80 active:bg-blaze-orange/90 disabled:opacity-50">
          <Heart className="w-12 h-12" />
        </Button>
      </div>
    </div>
  );
}