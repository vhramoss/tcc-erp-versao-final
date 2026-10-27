import { Badge, type Tom } from '@/components/ui';
import { hojeISO } from '@/lib/format';

interface StatusPedidoLike { nome: string; ehInicial?: boolean; ehFinal?: boolean; ehCancelamento?: boolean }

/** Cancelado = vermelho; encerrado = verde; inicial = azul; demais etapas = âmbar. */
export function StatusPedidoBadge({ status }: { status: StatusPedidoLike }) {
  const tom: Tom = status.ehCancelamento ? 'perigo' : status.ehFinal ? 'sucesso' : status.ehInicial ? 'info' : 'alerta';
  return <Badge tom={tom}>{status.nome}</Badge>;
}

/** "Atrasado" não é um status gravado: é pendente com vencimento anterior a hoje (fuso de São Paulo). */
export const estaAtrasada = (status: string, vencimento?: string | null) => status === 'PENDENTE' && !!vencimento && vencimento.slice(0, 10) < hojeISO();

export function StatusFinanceiroBadge({ status, tipo, vencimento, atrasado }: { status: string; tipo?: string; vencimento?: string | null; atrasado?: boolean }) {
  if (status === 'CANCELADO') return <Badge>Cancelado</Badge>;
  if (status === 'PAGO') return <Badge tom="sucesso">{tipo === 'DESPESA' ? 'Pago' : 'Recebido'}</Badge>;
  return (atrasado ?? estaAtrasada(status, vencimento)) ? <Badge tom="perigo">Atrasado</Badge> : <Badge tom="alerta">Pendente</Badge>;
}
