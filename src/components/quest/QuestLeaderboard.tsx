import type { LeaderboardEntry } from "@shared/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown } from "lucide-react";
interface QuestLeaderboardProps {
  leaderboard: LeaderboardEntry[];
}
export function QuestLeaderboard({ leaderboard }: QuestLeaderboardProps) {
  return (
    <div className="border-2 border-blaze-black bg-blaze-white">
      <h2 className="font-display text-4xl font-bold p-6 border-b-2 border-blaze-black">LEADERBOARD</h2>
      {leaderboard.length === 0 ? (
        <p className="p-6 font-mono text-lg text-center">Leaderboard data is not available yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-blaze-black hover:bg-blaze-white">
              <TableHead className="font-mono text-lg uppercase tracking-widest">Rank</TableHead>
              <TableHead className="font-mono text-lg uppercase tracking-widest">Player</TableHead>
              <TableHead className="text-right font-mono text-lg uppercase tracking-widest">Value</TableHead>
              <TableHead className="text-right font-mono text-lg uppercase tracking-widest">P&L %</TableHead>
              <TableHead className="text-right font-mono text-lg uppercase tracking-widest">Prize</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map((entry) => {
              const isPositivePnl = entry.pnlPercent >= 0;
              return (
                <TableRow key={entry.rank} className="border-b-2 border-blaze-black last:border-b-0 font-mono font-bold text-2xl hover:bg-blaze-white/50">
                  <TableCell>{entry.rank}</TableCell>
                  <TableCell>{entry.address}</TableCell>
                  <TableCell className="text-right">${entry.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  <TableCell className={`text-right ${isPositivePnl ? 'text-green-600' : 'text-red-600'}`}>
                    <div className="flex items-center justify-end gap-1">
                      {isPositivePnl ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      {entry.pnlPercent.toFixed(2)}%
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {entry.prizeWon && entry.prizeWon > 0 ? (
                      <span className="text-yellow-600 font-bold">
                        ${entry.prizeWon.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}