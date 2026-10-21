import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EstoqueModule } from '../estoque/estoque.module';
import { FinanceiroModule } from '../financeiro/financeiro.module';
import { PedidosController } from './pedidos.controller';
import { PedidosService } from './pedidos.service';
import { StatusController } from './status.controller';
import { StatusService } from './status.service';

@Module({
  imports: [PrismaModule, EstoqueModule, FinanceiroModule],
  controllers: [StatusController, PedidosController],
  providers: [PedidosService, StatusService],
})
export class PedidosModule {}
