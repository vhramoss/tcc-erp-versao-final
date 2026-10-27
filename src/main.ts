import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { OcultarCustosInterceptor } from './common/interceptors/ocultar-custos.interceptor';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.disable('x-powered-by');

  // Atrás do BFF (Next.js) todas as requisições chegam do IP do servidor web. Para o limitador de
  // tentativas de login enxergar o IP real do usuário, informe em quem confiar: TRUST_PROXY=loopback
  // (mesma máquina), um número de saltos (1) ou uma sub-rede. Vazio = não confia em nenhum cabeçalho.
  const trustProxy = process.env.TRUST_PROXY?.trim();
  if (trustProxy) {
    app.set('trust proxy', /^\d+$/.test(trustProxy) ? Number(trustProxy) : trustProxy === 'true' ? true : trustProxy);
  }

  // VALIDAÇÃO GLOBAL DOS DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove campos que não estão no DTO
      forbidNonWhitelisted: true, // Lança erro se houver campos extras
      transform: true, // Converte tipos automaticamente (ex: string -> number)
    }),
  );

  // Converte erros do Prisma (P2002, P2025...) em respostas HTTP corretas (409, 404...)
  app.useGlobalFilters(new PrismaExceptionFilter());

  // Sanitiza o body (trim), padroniza a resposta { success, data, timestamp } e oculta custos de quem não tem financeiro.ler
  app.useGlobalInterceptors(new SanitizeInterceptor(), new TransformInterceptor(), new OcultarCustosInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
