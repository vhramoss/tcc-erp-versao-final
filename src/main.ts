import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module'
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SanitizeInterceptor } from './common/interceptors/sanitize.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CONFIGURAÇÃO GLOBAL DE VALIDAÇÃO
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,            // Remove campos que não estão no DTO
    forbidNonWhitelisted: true, // Lança erro se houver campos extras
    transform: true,            // Transforma tipos automaticamente (ex: string para number/date)
  }));

  // REGISTRO GLOBAL DO INTERCEPTOR DE RESPOSTA
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalInterceptors(new SanitizeInterceptor());
  await app.listen(3000);
}

bootstrap();
