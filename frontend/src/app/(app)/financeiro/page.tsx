import type { Metadata } from 'next';
import { FinanceiroView } from '@/modules/financeiro/financeiro-view';

export const metadata: Metadata = { title: 'Financeiro' };
export default function Page() { return <FinanceiroView />; }
