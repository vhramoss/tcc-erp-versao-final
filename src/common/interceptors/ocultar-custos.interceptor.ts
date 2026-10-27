import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Campos que revelam custo/margem. Só quem tem financeiro.ler enxerga.
const CHAVES_DE_CUSTO = new Set(['precoCusto', 'custoUnitario']);

/** Remove, em qualquer nível, as chaves de custo de objetos simples e listas. Decimal e Date passam intactos. */
export function removerCustos(valor: unknown): unknown {
  if (Array.isArray(valor)) return valor.map(removerCustos);
  if (valor && typeof valor === 'object' && Object.getPrototypeOf(valor) === Object.prototype) {
    const saida: Record<string, unknown> = {};
    for (const [chave, item] of Object.entries(valor)) if (!CHAVES_DE_CUSTO.has(chave)) saida[chave] = removerCustos(item);
    return saida;
  }
  return valor;
}

/**
 * Proteção no servidor: o frontend nunca deve ser o único lugar que esconde custo. A resposta de
 * qualquer rota sai sem precoCusto/custoUnitario para usuários sem a permissão financeiro.ler.
 */
@Injectable()
export class OcultarCustosInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const podeVer = !!request.user?.permissoes?.includes('financeiro.ler');
    return next.handle().pipe(map((dados) => (podeVer ? dados : removerCustos(dados))));
  }
}
