import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { PedidoDetalhe } from '@/modules/pedidos/pedido-detalhe';

export const metadata: Metadata = { title: 'Pedido' };
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound();
  return <PedidoDetalhe id={Number(id)} />;
}
