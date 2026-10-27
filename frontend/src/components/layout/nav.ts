import { BarChart3, Boxes, Landmark, LayoutDashboard, Package, ShoppingCart, ShieldCheck, Truck, Users, type LucideIcon } from 'lucide-react';
import type { Recurso } from '@/lib/permissoes';

export interface ItemMenu { href: string; rotulo: string; icone: LucideIcon; recurso?: Recurso; grupo: 'Visão geral' | 'Operação' | 'Gestão' }

// Cada item só aparece para quem tem `<recurso>.ler` (o backend barra de qualquer forma).
export const MENU: ItemMenu[] = [
  { href: '/', rotulo: 'Painel', icone: LayoutDashboard, grupo: 'Visão geral' },
  { href: '/pedidos', rotulo: 'Pedidos', icone: ShoppingCart, recurso: 'pedidos', grupo: 'Operação' },
  { href: '/clientes', rotulo: 'Clientes', icone: Users, recurso: 'clientes', grupo: 'Operação' },
  { href: '/produtos', rotulo: 'Produtos', icone: Package, recurso: 'produtos', grupo: 'Operação' },
  { href: '/estoque', rotulo: 'Estoque', icone: Boxes, recurso: 'estoque', grupo: 'Operação' },
  { href: '/compras', rotulo: 'Compras', icone: Truck, recurso: 'compras', grupo: 'Operação' },
  { href: '/financeiro', rotulo: 'Financeiro', icone: Landmark, recurso: 'financeiro', grupo: 'Gestão' },
  { href: '/acessos', rotulo: 'Acessos', icone: ShieldCheck, recurso: 'acessos', grupo: 'Gestão' },
];

export const ICONE_MARCA = BarChart3;
