import type { Metadata } from 'next';
import { StatusView } from '@/modules/pedidos/status-view';

export const metadata: Metadata = { title: 'Status dos pedidos' };
export default function Page() { return <StatusView />; }
