import type { Metadata } from 'next';
import { DashboardView } from '@/modules/dashboard/dashboard-view';

export const metadata: Metadata = { title: 'Painel' };
export default function Page() { return <DashboardView />; }
