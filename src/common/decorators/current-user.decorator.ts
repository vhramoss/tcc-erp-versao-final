import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserContext {
  id: string;
  idEmpresa: string;
  role: string;
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserContext => {
    const request = ctx.switchToHttp().getRequest();
    // Em um cenário real, isso viria do JWT decodificado pelo AuthGuard
    return request.user as UserContext;
  },
);
