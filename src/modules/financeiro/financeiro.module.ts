import { Module } from '@nestjs/common';
import { FinanceiroController } from './controllers/financeiro.controller';
import { FinanceiroService } from './services/financeiro.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinanceiroController],
  providers: [FinanceiroService],
  // Exportado para o módulo de Pedidos (passo 4) gerar/cancelar lançamentos dentro da transação.
  exports: [FinanceiroService],
})
export class FinanceiroModule {}
