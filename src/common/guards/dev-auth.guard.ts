import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

/**
 * GUARD TEMPORÁRIO DE DESENVOLVIMENTO (será substituído no passo 5 pelo JWT).
 *
 * Preenche request.user a partir dos headers x-empresa-id e x-user-id, para que
 * os módulos possam ser testados antes da autenticação real existir.
 *
 * FALHA FECHADO em produção: aceitar headers do cliente como identidade permitiria
 * a qualquer um acessar os dados de qualquer empresa (quebra do multi-tenant).
 */
@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    if (process.env.NODE_ENV === 'production') {
      throw new UnauthorizedException('Autenticação real ainda não implementada neste ambiente.');
    }

    const request = context.switchToHttp().getRequest();
    const idEmpresa = request.headers['x-empresa-id'];
    const id = request.headers['x-user-id'];

    if (typeof idEmpresa !== 'string' || !idEmpresa || typeof id !== 'string' || !id) {
      throw new UnauthorizedException(
        'Informe os headers x-empresa-id e x-user-id (guard temporário de desenvolvimento).',
      );
    }

    request.user = { id, idEmpresa, role: 'DEV' };
    return true;
  }
}
