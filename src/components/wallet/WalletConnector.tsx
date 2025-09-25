import { Button } from "@/components/ui/button";
import { useWallet, WalletReadyState } from "@aptos-labs/wallet-adapter-react";
import type { WalletInfo } from "@aptos-labs/wallet-adapter-core";
import { usePortfolioStore } from "@/stores/portfolioStore";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { toast } from "sonner";

import { ChevronDown, Coins } from "lucide-react";
import { useNavigate } from "react-router-dom";
export function WalletConnector() {
  const { connect, disconnect, account, wallets, connected, isLoading } = useWallet();
  const { setConnected, setDisconnected } = usePortfolioStore();
  const navigate = useNavigate();
  
  // State for auto-reconnection
  const [hasAttemptedReconnection, setHasAttemptedReconnection] = useState(false);
  const [lastConnectedWallet, setLastConnectedWallet] = useState<string | null>(
    localStorage.getItem('lastConnectedWallet')
  );

  useEffect(() => {
    if (connected && account) {
      const currentWallet = wallets.find(w => w.name === account.publicKey?.toString());
      setConnected(account.address.toString(), currentWallet?.name);
      // Store the connected wallet name
      if (currentWallet?.name) {
        setLastConnectedWallet(currentWallet.name);
        localStorage.setItem('lastConnectedWallet', currentWallet.name);
      }
    } else {
      setDisconnected();
    }
  }, [connected, account, setConnected, setDisconnected, wallets]);

  // Attempt automatic reconnection on app load
  useEffect(() => {
    if (!hasAttemptedReconnection && !connected && lastConnectedWallet && wallets.length > 0) {
      setHasAttemptedReconnection(true);
      const wallet = wallets.find(w => w.name === lastConnectedWallet);
      if (wallet) {
        try {
          connect(wallet.name);
        } catch (error) {
          console.log('Auto-reconnection failed:', error);
          // Don't show error toast for auto-reconnection failures
        }
      }
    }
  }, [hasAttemptedReconnection, connected, lastConnectedWallet, wallets, connect]);

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setLastConnectedWallet(null);
      localStorage.removeItem('lastConnectedWallet');
      toast.success("Wallet disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect wallet:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  const handleConnect = async (walletName: string) => {
    try {
      await connect(walletName);
      toast.success("Wallet connected successfully");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast.error("Failed to connect wallet");
    }
  };

  const getShortAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;

  if (connected && account) {
    return (
      <div className="flex items-center gap-2 md:gap-4 font-mono">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-12 rounded-none border-2 border-blaze-black bg-blaze-white text-lg font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-blaze-white/80"
            >
              {getShortAddress(account.address.toString())}
              <ChevronDown className="w-6 h-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="rounded-none border-2 border-blaze-black bg-blaze-white font-mono text-lg w-56">
            <DropdownMenuItem
              onClick={() => navigate("/create-token")}
              className="cursor-pointer focus:bg-blaze-orange focus:text-blaze-black h-12 flex items-center gap-2"
            >
              <Coins className="w-4 h-4" />
              Create Token
            </DropdownMenuItem>
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

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className="h-12 rounded-none border-2 border-blaze-black bg-blaze-orange text-blaze-black text-lg font-bold uppercase tracking-wider hover:bg-blaze-black hover:text-blaze-white active:translate-y-px active:translate-x-px"
          disabled={isLoading}
        >
          {isLoading ? "Connecting..." : "Connect Wallet"}
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none border-2 border-blaze-black bg-blaze-white">
        <DialogHeader>
          <DialogTitle className="font-display text-4xl font-bold text-blaze-black">Connect a Wallet</DialogTitle>
          <DialogDescription className="sr-only">Select a wallet to connect to the application.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 pt-4 font-mono">
          {wallets.map((wallet: WalletInfo) => (
            <Button
              key={wallet.name}
              onClick={() => handleConnect(wallet.name)}
              className="h-14 rounded-none border-2 border-blaze-black bg-blaze-white text-blaze-black text-xl font-bold uppercase tracking-wider hover:bg-blaze-orange hover:text-blaze-black active:translate-y-px active:translate-x-px flex items-center justify-start gap-4"
              disabled={false}
            >
              <img src={wallet.icon} alt={wallet.name} className="w-8 h-8" />
              <span>{wallet.name}</span>
              {wallet.name === lastConnectedWallet && (
                <span className="ml-auto text-sm text-blaze-black/60">(Last used)</span>
              )}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
