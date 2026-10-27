'use client';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RECURSOS, ROTULO_RECURSO, type Recurso } from '@/lib/permissoes';

interface Props {
  valor: string[];
  onChange: (valor: string[]) => void;
  /** Permissões que quem edita pode conceder (a regra anti-autoelevação do servidor). null = todas. */
  concedíveis?: Set<string> | null;
  /** Permissões que o departamento do usuário NÃO tem: mesmo marcadas, não valem na prática. */
  bloqueadasPeloDepartamento?: Set<string> | null;
  somenteLeitura?: boolean;
}

/** Recursos × (ler, gerenciar). Marcar "gerenciar" marca "ler" junto, já que alterar sem ver não faz sentido. */
export function PermissoesMatriz({ valor, onChange, concedíveis = null, bloqueadasPeloDepartamento = null, somenteLeitura }: Props) {
  const marcadas = new Set(valor);
  const alternar = (nome: string, recurso: Recurso, nivel: 'ler' | 'gerenciar') => {
    const proximo = new Set(marcadas);
    if (proximo.has(nome)) {
      proximo.delete(nome);
      if (nivel === 'ler') proximo.delete(`${recurso}.gerenciar`);
    } else {
      proximo.add(nome);
      if (nivel === 'gerenciar') proximo.add(`${recurso}.ler`);
    }
    onChange([...proximo].sort());
  };

  return (
    <div className="overflow-hidden rounded-xl border border-line">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-line bg-surface-2/60 text-xs text-muted"><th className="px-4 py-2.5 text-left font-medium">Área</th><th className="w-24 px-3 py-2.5 text-center font-medium">Ver</th><th className="w-28 px-3 py-2.5 text-center font-medium">Alterar</th></tr></thead>
        <tbody className="divide-y divide-line">
          {RECURSOS.map((r) => (
            <tr key={r}>
              <td className="px-4 py-2.5 font-medium">{ROTULO_RECURSO[r]}</td>
              {(['ler', 'gerenciar'] as const).map((nivel) => {
                const nome = `${r}.${nivel}`;
                const permitido = !somenteLeitura && (!concedíveis || concedíveis.has(nome));
                const bloqueado = bloqueadasPeloDepartamento?.has(nome) && marcadas.has(nome);
                return (
                  <td key={nivel} className="px-3 py-2.5 text-center">
                    <label className={cn('inline-flex items-center justify-center', !permitido && 'cursor-not-allowed opacity-50')} title={!permitido && !somenteLeitura ? 'Você não possui esta permissão para conceder.' : bloqueado ? 'O departamento deste usuário não tem esta permissão.' : undefined}>
                      <input type="checkbox" className="size-4 accent-[hsl(var(--brand))]" checked={marcadas.has(nome)} disabled={!permitido} onChange={() => alternar(nome, r, nivel)} aria-label={`${nivel === 'ler' ? 'Ver' : 'Alterar'} ${ROTULO_RECURSO[r]}`} />
                      {!permitido && !somenteLeitura && <Lock className="ml-1 size-3 text-muted" aria-hidden />}
                      {bloqueado && <span className="ml-1 text-[10px] font-medium text-warning">sem efeito</span>}
                    </label>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
