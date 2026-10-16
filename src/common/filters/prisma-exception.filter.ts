import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Response } from 'express';

/**
 * Traduz erros conhecidos do Prisma para respostas HTTP adequadas,
 * evitando que violações de unicidade (e-mail, SKU, CNPJ...) virem "500".
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();

    const mapa: Record<string, [number, string]> = {
      P2002: [409, 'Já existe um registro com estes dados (valor único duplicado).'],
      P2003: [409, 'A operação viola um vínculo com outro registro.'],
      P2025: [404, 'Registro não encontrado.'],
    };

    const [statusCode, message] = mapa[exception.code] ?? [
      500,
      'Erro interno ao acessar o banco de dados.',
    ];

    if (statusCode === 500) {
      this.logger.error(`Erro Prisma ${exception.code}: ${exception.message}`);
    }

    response.status(statusCode).json({
      success: false,
      statusCode,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
