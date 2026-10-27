import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserContext {
  id: number;
  idEmpresa: number;
  departamentoId?: number;
  sessaoId?: number;
  permissoes?: string[];
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserContext => {
    const request = ctx.switchToHttp().getRequest();
    // Identidade validada pelo JwtAuthGuard e conferida no banco.
    return request.user as UserContext;
  },
);
