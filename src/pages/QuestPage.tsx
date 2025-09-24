import { QuestCard } from "@/components/quest/QuestCard";
import type { Quest } from "@shared/types";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { Toaster, toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
const QuestSkeleton = () => (
  <div className="w-full bg-blaze-white border-2 border-blaze-black p-6 flex flex-col gap-6">
    <div className="flex justify-between items-start">
      <Skeleton className="h-10 w-3/4 bg-blaze-black/10" />
      <Skeleton className="h-6 w-20 bg-blaze-black/10" />
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      <Skeleton className="h-24 w-full bg-blaze-black/10" />
      <Skeleton className="h-24 w-full bg-blaze-black/10" />
      <Skeleton className="h-24 w-full bg-blaze-black/10" />
      <Skeleton className="h-24 w-full bg-blaze-black/10" />
    </div>
    <Skeleton className="h-14 w-full bg-blaze-black/10" />
  </div>
);
export function QuestPage() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchQuests = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api<{ items: Quest[] }>('/api/quests');
        setQuests(data.items);
      } catch (err) {
        setError("Failed to fetch quests. Please try again later.");
        toast.error("Failed to fetch quests.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchQuests();
  }, []);
  const renderContent = () => {
    if (loading) {
      return Array.from({ length: 3 }).map((_, i) => <QuestSkeleton key={i} />);
    }
    if (error) {
      return (
        <div className="border-2 border-red-600 bg-red-50 p-6 text-center font-mono">
          <h3 className="font-display text-3xl font-bold text-red-600">ERROR</h3>
          <p className="mt-2 text-red-800">{error}</p>
        </div>
      );
    }
    if (quests.length === 0) {
        return (
            <div className="border-2 border-blaze-black bg-blaze-white p-6 text-center font-mono">
                <h3 className="font-display text-3xl font-bold">NO QUESTS AVAILABLE</h3>
                <p className="mt-2 text-blaze-black/70">Check back soon for new challenges!</p>
            </div>
        );
    }
    return quests.map((quest) => (
      <Link to={`/quests/${quest.id}`} key={quest.id} className="block hover:opacity-90 active:translate-y-px active:translate-x-px transition-transform shadow-blaze-shadow">
        <QuestCard quest={quest} />
      </Link>
    ));
  };
  return (
    <div className="p-4 md:p-8">
      <Toaster richColors closeButton />
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="font-display text-6xl md:text-8xl font-bold text-blaze-black">QUESTS</h1>
        <div className="space-y-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}