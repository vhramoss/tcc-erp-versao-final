import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PlanoContasController } from './controllers/plano-contas.controller';
import { PlanoContasService } from './services/plano-contas.service';
import { CentroCustoController } from './controllers/centro-custo.controller';
import { CentroCustoService } from './services/centro-custo.service';
import { FormasPagamentoController } from './controllers/formas-pagamento.controller';
import { FormasPagamentoService } from './services/formas-pagamento.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    PlanoContasController,
    CentroCustoController,
    FormasPagamentoController,
  ],
  providers: [
    PlanoContasService,
    CentroCustoService,
    FormasPagamentoService,
  ],
})
export class TesourariaModule {}