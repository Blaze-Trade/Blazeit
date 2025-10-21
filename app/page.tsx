'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { TradePage } from '@/page-components/TradePage';

export default function Home() {
  return (
    <MainLayout>
      <TradePage />
    </MainLayout>
  );
}

