import { Button } from "@/components/ui/button";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { ChevronDown, Coins } from "lucide-react";
import { Link } from "react-router-dom";
export function ProfileDropdown() {
  const { disconnect, account } = useWallet();
  const address = usePortfolioStore((state) => state.address);
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
            className="h-12 rounded-none border-2 border-blaze-black bg-blaze-white text-lg font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-blaze-white/80"
          >
            {getShortAddress(address || account?.address.toString())}
            <ChevronDown className="w-6 h-6" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-none border-2 border-blaze-black bg-blaze-white font-mono text-lg w-56">
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12 flex items-center gap-2">
            <Link to="/create-token" className="flex items-center gap-2">
              <Coins className="w-4 h-4" />
              Create Token
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12">
            <Link to="/create-quest">Create Quest</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12">
            <Link to="/watchlist">Watchlist</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12">
            <Link to="/analysis">Profile</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-blaze-black" />
          <DropdownMenuItem
            onClick={disconnect}
            className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12"
          >
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}