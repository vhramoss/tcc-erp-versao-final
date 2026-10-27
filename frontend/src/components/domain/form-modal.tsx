'use client';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, Input, Modal, Select } from '@/components/ui';

export interface CampoSimples {
  chave: string;
  rotulo: string;
  placeholder?: string;
  obrigatorio?: boolean;
  dica?: string;
  padrao?: string;
  opcoes?: { valor: string; rotulo: string }[]; // presente => vira <select>
  transformar?: (valor: string) => string;
  tipo?: string;
}

interface Props {
  aberto: boolean;
  onFechar: () => void;
  titulo: string;
  descricao?: string;
  campos: CampoSimples[];
  inicial?: Record<string, string>;
  rotuloSalvar?: string;
  onSubmit: (valores: Record<string, string>) => Promise<unknown>;
}

/** Formulário de poucos campos de texto/seleção em um modal. Fecha só se o salvamento der certo. */
export function FormModal({ aberto, onFechar, titulo, descricao, campos, inicial, rotuloSalvar = 'Salvar', onSubmit }: Props) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setValores(Object.fromEntries(campos.map((c) => [c.chave, inicial?.[c.chave] ?? c.padrao ?? ''])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aberto]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    try {
      await onSubmit(valores);
      onFechar();
    } catch {
      /* o aviso de erro já foi exibido pela camada de mutações */
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal aberto={aberto} onFechar={onFechar} titulo={titulo} descricao={descricao}
      rodape={<>
        <Button variante="outline" onClick={onFechar} disabled={enviando}>Cancelar</Button>
        <Button type="submit" form="form-simples" carregando={enviando}>{rotuloSalvar}</Button>
      </>}>
      <form id="form-simples" onSubmit={enviar} className="space-y-4">
        {campos.map((c) => {
          const comum = { rotulo: c.rotulo, obrigatorio: c.obrigatorio, dica: c.dica };
          const mudar = (v: string) => setValores((atual) => ({ ...atual, [c.chave]: c.transformar ? c.transformar(v) : v }));
          return c.opcoes ? (
            <Select key={c.chave} {...comum} value={valores[c.chave] ?? ''} onChange={(e) => mudar(e.target.value)}>
              {c.opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
            </Select>
          ) : (
            <Input key={c.chave} {...comum} type={c.tipo ?? 'text'} placeholder={c.placeholder} value={valores[c.chave] ?? ''} onChange={(e) => mudar(e.target.value)} />
          );
        })}
      </form>
    </Modal>
  );
}
