import type { Metadata } from 'next';
import { ProdutosView } from '@/modules/produtos/produtos-view';

export const metadata: Metadata = { title: 'Produtos' };
export default function Page() { return <ProdutosView />; }
