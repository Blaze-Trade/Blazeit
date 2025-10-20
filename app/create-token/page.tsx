'use client';

import { MainLayout } from '@/components/layout/MainLayout';
import { TokenCreationPage } from '@/page-components/TokenCreationPage';

export default function CreateToken() {
  return (
    <MainLayout>
      <TokenCreationPage />
    </MainLayout>
  );
}

