import type { Metadata } from 'next';
import { NovoPedido } from '@/modules/pedidos/novo-pedido';

export const metadata: Metadata = { title: 'Novo pedido' };
export default function Page() { return <NovoPedido />; }
