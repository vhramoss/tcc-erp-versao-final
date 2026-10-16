import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Sanitiza o body (trim) e padroniza o formato de resposta { success, data, timestamp }
  app.useGlobalInterceptors(new SanitizeInterceptor(), new TransformInterceptor());

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
