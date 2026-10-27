import type { Metadata } from 'next';
import { NovaCompra } from '@/modules/compras/nova-compra';

export const metadata: Metadata = { title: 'Nova compra' };
export default function Page() { return <NovaCompra />; }
