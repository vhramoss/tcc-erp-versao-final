import type { Metadata } from 'next';
import { AcessosView } from '@/modules/acessos/acessos-view';

export const metadata: Metadata = { title: 'Acessos' };
export default function Page() { return <AcessosView />; }
