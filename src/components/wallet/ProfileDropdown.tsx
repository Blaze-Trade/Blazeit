import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export function ProfileDropdown() {
  const { disconnect, account } = useWallet();
  const { address, theme, setTheme } = usePortfolioStore();

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast.success("Wallet disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
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
            {getShortAddress(address || account?.address.toString())}
            <ChevronDown className="w-6 h-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-none border-2 border-blaze-black bg-blaze-white font-mono text-lg w-56 dark:border-blaze-white dark:bg-blaze-black dark:text-blaze-white">
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12"
          >
            <Link to="/create-quest">Create Quest</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12"
          >
            <Link to="/watchlist">Watchlist</Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            asChild
            className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12"
          >
            <Link to="/analysis">Profile</Link>
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
