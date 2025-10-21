import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

import { ChevronDown, Coins, Moon, Sun } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export function ProfileDropdown() {
  const { disconnect, account } = useWallet();
  const { address, theme, setTheme, setDisconnected } = usePortfolioStore();

  const handleDisconnect = async () => {
    try {
      console.log("🔄 Attempting to disconnect wallet from ProfileDropdown...");
      await disconnect();
      console.log("✅ Wallet disconnected successfully from ProfileDropdown");
      setDisconnected(); // Update portfolio store
      toast.success("Wallet disconnected successfully");
    } catch (error) {
      console.error(
        "❌ Failed to disconnect wallet from ProfileDropdown:",
        error
      );
      toast.error("Failed to disconnect wallet");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
    toast.success(`Switched to ${theme === "light" ? "dark" : "light"} mode`);
  };

  const getShortAddress = (addr: string | null) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="flex items-center gap-2 md:gap-4 font-mono">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="h-12 rounded-none border-2 border-blaze-black bg-blaze-white text-lg font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-blaze-white/80 dark:border-blaze-white dark:bg-blaze-black dark:text-blaze-white dark:hover:bg-blaze-black/80"
          >
            {getShortAddress(address || account?.address.toString() || null)}
            <ChevronDown className="w-6 h-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-none border-2 border-blaze-black bg-blaze-white font-mono text-lg w-56">
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12 flex items-center gap-2"
          >
            <Link href="/create-token" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Create Token
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12"
          >
            <Link href="/create-quest">Create Quest</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12"
          >
            <Link href="/watchlist">Watchlist</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12"
          >
            <Link href="/analysis">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-blaze-black dark:bg-blaze-white" />
          <DropdownMenuItem
            onClick={toggleTheme}
            className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12 flex items-center gap-2"
          >
            {theme === "light" ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-blaze-black dark:bg-blaze-white" />
          <DropdownMenuItem
            onClick={handleDisconnect}
            className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12"
          >
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
