import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { RouteErrorBoundary } from '@/components/RouteErrorBoundary';
import { HomePage } from '@/pages/HomePage';
import { TradePage } from '@/pages/TradePage';
import { AnalysisPage } from '@/pages/AnalysisPage';
import { QuestPage } from '@/pages/QuestPage';
import { QuestDetailPage } from '@/pages/QuestDetailPage';
import { WatchlistPage } from '@/pages/WatchlistPage';
import { CreateQuestPage } from '@/pages/CreateQuestPage'; // New import
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { useEffect, useMemo, useState } from 'react';
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        index: true,
        element: <TradePage />,
      },
      {
        path: "analysis",
        element: <AnalysisPage />,
      },
      {
        path: "quests",
        element: <QuestPage />,
      },
      {
        path: "quests/:questId",
        element: <QuestDetailPage />,
      },
      {
        path: "watchlist",
        element: <WatchlistPage />,
      },
      {
        path: "create-quest", // New route
        element: <CreateQuestPage />,
      },
    ],
  },
]);
function App() {
  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const [wallets, setWallets] = useState<any[]>([]);
  const [walletsReady, setWalletsReady] = useState(false);
  useEffect(() => {
    if (!isClient) return;
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
    return () => { mounted = false };
  }, [isClient]);

  if (!walletsReady) {
    return null;
  }

  return (
    <AptosWalletAdapterProvider plugins={wallets} autoConnect={false}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </AptosWalletAdapterProvider>
  );
}
export default App;