'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { useEffect, useState } from 'react';

interface WalletProviderProps {
  children: React.ReactNode;
}

export function WalletProvider({ children }: WalletProviderProps) {
  const [wallets, setWallets] = useState<any[]>([]);
  const [walletsReady, setWalletsReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const mod = await import('petra-plugin-wallet-adapter');
        const instance = new mod.PetraWallet();
        if (mounted) {
          setWallets([instance]);
          setWalletsReady(true);
        }
      } catch (e) {
        console.error('Failed to load Petra wallet', e);
        if (mounted) setWalletsReady(true);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (!walletsReady) {
    return <div>Loading wallet...</div>;
  }

  return (
    <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
      {children}
    </AptosWalletAdapterProvider>
  );
}
