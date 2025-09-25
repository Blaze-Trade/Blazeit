import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api-client';
import type { Quest, LeaderboardEntry } from '@shared/types';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from '@/components/ui/sonner';
import { ArrowLeft, Swords } from 'lucide-react';
import { QuestLeaderboard } from '@/components/quest/QuestLeaderboard';
import { QuestPortfolio as QuestPortfolioComponent } from '@/components/quest/QuestPortfolio';
import { QuestTokenSelection } from '@/components/quest/QuestTokenSelection';
import { cn } from '@/lib/utils';

const statusStyles = {
  upcoming: "bg-blue-500 border-blue-500",
  active: "bg-blaze-orange border-blaze-orange",
  ended: "bg-blaze-black/50 border-blaze-black/50",
};

export function QuestDetailPage() {
  const { questId } = useParams<{ questId: string }>();
  const navigate = useNavigate();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTokenSelection, setShowTokenSelection] = useState(false);
  const { isConnected, address, joinedQuests, setActiveQuest } = usePortfolioStore();

  const isJoined = questId ? joinedQuests.includes(questId) : false;

  useEffect(() => {
    if (!questId) {
      setError("No Quest ID provided.");
      setLoading(false);
      return;
    }

    const fetchQuestData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [questData, leaderboardData] = await Promise.all([
          api<Quest>(`/api/quests/${questId}`),
          api<LeaderboardEntry[]>(`/api/quests/${questId}/leaderboard`)
        ]);
        setQuest(questData);
        setLeaderboard(leaderboardData);
      } catch (err) {
        setError("Failed to fetch quest details.");
        toast.error("Failed to fetch quest details.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestData();
  }, [questId]);

  const handleJoinQuest = () => {
    if (!quest || !isConnected || !address) {
      toast.error("Please connect your wallet to join a quest.");
      return;
    }
    setShowTokenSelection(true);
  };

  const handleBuildPortfolio = () => {
    if (quest) {
      setActiveQuest(quest);
      navigate('/');
    }
  };

  if (loading) {
    return <div className="p-4 md:p-8"><Skeleton className="w-full h-96 bg-blaze-black/10" /></div>;
  }

  if (error || !quest) {
    return <div className="p-4 md:p-8 text-center text-red-500 font-bold">{error || "Quest not found."}</div>;
  }

  if (showTokenSelection) {
    return (
      <QuestTokenSelection
        quest={quest}
        onBack={() => setShowTokenSelection(false)}
      />
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Toaster richColors closeButton />
      <div className="max-w-7xl mx-auto space-y-8">
        <Button
          variant="outline"
          onClick={() => navigate('/quests')}
          className="border-2 border-blaze-black rounded-none h-12 px-4 flex items-center gap-2 font-bold uppercase text-lg hover:bg-blaze-black/5"
        >
          <ArrowLeft /> Back to Quests
        </Button>

        <div className="border-2 border-blaze-black bg-blaze-white p-6 md:p-8 space-y-6 shadow-blaze-shadow">
          <div className="flex justify-between items-start">
            <h1 className="font-display text-5xl md:text-7xl font-bold text-blaze-black">{quest.name}</h1>
            <div className={cn("text-blaze-white font-mono font-bold uppercase tracking-widest px-3 py-1 text-sm", statusStyles[quest.status])}>
              {quest.status}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 font-mono">
            <div className="border-2 border-blaze-black p-4">
              <p className="text-sm uppercase tracking-wider text-blaze-black/70">Prize Pool</p>
              <p className="text-3xl font-bold">${quest.prizePool.toLocaleString()}</p>
            </div>
            <div className="border-2 border-blaze-black p-4">
              <p className="text-sm uppercase tracking-wider text-blaze-black/70">Entry</p>
              <p className="text-3xl font-bold">${quest.entryFee}</p>
            </div>
            <div className="border-2 border-blaze-black p-4">
              <p className="text-sm uppercase tracking-wider text-blaze-black/70">Players</p>
              <p className="text-3xl font-bold">{quest.participants}</p>
            </div>
            <div className="border-2 border-blaze-black p-4">
              <p className="text-sm uppercase tracking-wider text-blaze-black/70">Duration</p>
              <p className="text-3xl font-bold">{quest.duration}</p>
            </div>
          </div>

          {!isJoined && quest.status !== 'ended' && (
            <Button
              onClick={handleJoinQuest}
              disabled={!isConnected}
              className="w-full h-14 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black text-xl font-bold uppercase tracking-wider hover:bg-blaze-black hover:text-blaze-white active:translate-y-px active:translate-x-px"
            >
              Join Quest & Select Tokens
            </Button>
          )}

          {isJoined && quest.status === 'active' && (
            <Button
              onClick={handleBuildPortfolio}
              className="w-full h-14 rounded-none border-2 border-blaze-black bg-blaze-black text-blaze-white text-xl font-bold uppercase tracking-wider hover:bg-blaze-orange hover:text-blaze-black active:translate-y-px active:translate-x-px"
            >
              <Swords className="mr-2" /> Build Portfolio
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 shadow-blaze-shadow">
            <QuestLeaderboard leaderboard={leaderboard} />
          </div>
          {isJoined && address && questId && (
            <div className="border-2 border-blaze-black bg-blaze-white h-fit shadow-blaze-shadow">
              <QuestPortfolioComponent questId={questId} userId={address} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
