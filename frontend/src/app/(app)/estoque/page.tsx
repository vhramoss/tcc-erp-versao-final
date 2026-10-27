import type { Metadata } from 'next';
import { EstoqueView } from '@/modules/estoque/estoque-view';

export const metadata: Metadata = { title: 'Estoque' };
export default function Page() { return <EstoqueView />; }
