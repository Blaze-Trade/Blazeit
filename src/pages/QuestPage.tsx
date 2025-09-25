import { QuestCard } from "@/components/quest/QuestCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { useSupabaseQuests } from "@/hooks/useSupabaseQuests";
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
  const { quests, loading, error } = useSupabaseQuests();
  const renderContent = () => {
    if (loading) {
      return Array.from({ length: 3 }).map((_, i) => <QuestSkeleton key={i} />);
    }
    if (error) {
      return (
        <div className="border-2 border-red-600 bg-red-50 p-6 text-center font-mono">
          <h3 className="font-display text-3xl font-bold text-red-600">
            ERROR
          </h3>
          <p className="mt-2 text-red-800">{error}</p>
        </div>
      );
    }
    if (quests.length === 0) {
      return (
        <div className="border-2 border-blaze-black bg-blaze-white p-6 text-center font-mono">
          <h3 className="font-display text-3xl font-bold">
            NO QUESTS AVAILABLE
          </h3>
          <p className="mt-2 text-blaze-black/70">
            Check back soon for new challenges!
          </p>
        </div>
      );
    }
    return quests.map((quest) => (
      <div
        key={quest.id}
        className="block hover:opacity-90 active:translate-y-px active:translate-x-px transition-transform shadow-blaze-shadow"
      >
        <QuestCard quest={quest} />
      </div>
    ));
  };
  return (
    <div className="p-4 md:p-8">
      <Toaster richColors closeButton />
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="font-display text-6xl md:text-8xl font-bold text-blaze-black">
          QUESTS
        </h1>
        <div className="space-y-6">{renderContent()}</div>
      </div>
    </div>
  );
}
