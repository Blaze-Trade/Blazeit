import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WalletProvider } from '@/components/WalletProvider';
import { enableMapSet } from 'immer';
import './globals.css';

enableMapSet();

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>BlazeIt</title>
      </head>
      <body>
        <WalletProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
        </WalletProvider>
      </body>
    </html>
  );
}

