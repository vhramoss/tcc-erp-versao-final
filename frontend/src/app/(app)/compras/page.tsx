import type { Metadata } from 'next';
import { ComprasView } from '@/modules/compras/compras-view';

export const metadata: Metadata = { title: 'Compras' };
export default function Page() { return <ComprasView />; }
