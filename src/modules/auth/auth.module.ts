import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TokensService } from './tokens.service';
import { AuthLimiteGuard, JwtAuthGuard, PermissoesGuard } from './auth.guards';
import { AcessosController } from './acessos.controller';
import { AcessosService } from './acessos.service';

@Module({
  imports: [PrismaModule],
  controllers: [AuthController, AcessosController],
  providers: [AuthService, TokensService, AcessosService, AuthLimiteGuard,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissoesGuard },
  ],
})
export class AuthModule {}
