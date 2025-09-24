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
import { PetraWallet } from 'petra-plugin-wallet-adapter';
const wallets = [new PetraWallet()];
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
  return (
    <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
      <ErrorBoundary>
        <RouterProvider router={router} />
      </ErrorBoundary>
    </AptosWalletAdapterProvider>
  );
}
export default App;