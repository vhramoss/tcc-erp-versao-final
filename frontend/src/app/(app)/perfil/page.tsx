import type { Metadata } from 'next';
import { PerfilView } from '@/modules/perfil/perfil-view';

export const metadata: Metadata = { title: 'Minha conta' };
export default function Page() { return <PerfilView />; }
