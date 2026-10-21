import { CanActivate, ExecutionContext, ForbiddenException, HttpException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthService } from './auth.service';
import { AUTENTICADO, PUBLICA, RECURSO } from './auth.decorators';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly auth: AuthService) {}
  async canActivate(ctx: ExecutionContext) {
    if (this.reflector.getAllAndOverride(PUBLICA, [ctx.getHandler(), ctx.getClass()])) return true;
    const request = ctx.switchToHttp().getRequest();
    const header = request.headers.authorization;
    if (typeof header !== 'string' || !/^Bearer [^\s]+$/i.test(header)) throw new UnauthorizedException('Informe um access token Bearer.');
    request.user = await this.auth.autenticar(header.slice(7));
    return true;
  }
}

@Injectable()
export class PermissoesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(ctx: ExecutionContext) {
    const alvos = [ctx.getHandler(), ctx.getClass()];
    if (this.reflector.getAllAndOverride(PUBLICA, alvos)) return true;
    const request = ctx.switchToHttp().getRequest();
    if (!request.user) throw new UnauthorizedException();
    if (this.reflector.getAllAndOverride(AUTENTICADO, alvos)) return true;
    const recurso = this.reflector.getAllAndOverride<string>(RECURSO, alvos);
    const acao = ['GET', 'HEAD'].includes(request.method) ? 'ler' : 'gerenciar';
    if (!recurso || !request.user.permissoes?.includes(`${recurso}.${acao}`)) throw new ForbiddenException('Sem permissão para esta operação no seu departamento.');
    return true;
  }
}

// Limite por processo e IP; não confia em X-Forwarded-For fornecido pelo cliente.
@Injectable()
export class AuthLimiteGuard implements CanActivate {
  private readonly tentativas = new Map<string, { inicio: number; quantidade: number }>();
  canActivate(ctx: ExecutionContext) {
    const request = ctx.switchToHttp().getRequest();
    const ip = request.socket.remoteAddress ?? 'desconhecido';
    const agora = Date.now();
    for (const [chave, valor] of this.tentativas) if (agora - valor.inicio >= 60000) this.tentativas.delete(chave);
    const registro = this.tentativas.get(ip) ?? { inicio: agora, quantidade: 0 };
    if (registro.quantidade >= 20 || !this.tentativas.has(ip) && this.tentativas.size >= 10000) throw new HttpException('Muitas tentativas. Aguarde um minuto.', 429);
    registro.quantidade++;
    this.tentativas.set(ip, registro);
    return true;
  }
}
