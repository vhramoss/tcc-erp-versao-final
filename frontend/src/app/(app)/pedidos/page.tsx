import type { Metadata } from 'next';
import { PedidosView } from '@/modules/pedidos/pedidos-view';

export const metadata: Metadata = { title: 'Pedidos' };
export default function Page() { return <PedidosView />; }
