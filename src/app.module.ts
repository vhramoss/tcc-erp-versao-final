import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { EstoqueModule } from './modules/estoque/estoque.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';
import { PessoasModule } from './modules/pessoas/clientes.module';
import { TesourariaModule } from './modules/tesouraria/tesouraria.module';
import { AlmoxarifadoModule } from './modules/logistica/almoxarifado.module';
import { DevAuthGuard } from './common/guards/dev-auth.guard';
import { ComprasModule } from './modules/compras/compras.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';

@Module({
  imports: [
    PrismaModule,
    ProdutosModule,
    EstoqueModule,
    FinanceiroModule,
    PessoasModule,
    AlmoxarifadoModule,
    TesourariaModule,
    ComprasModule,
    PedidosModule,
  ],
  controllers: [],
  providers: [
    // TEMPORÁRIO (passo 5): substituir por JwtAuthGuard + PermissoesGuard.
    { provide: APP_GUARD, useClass: DevAuthGuard },
  ],
})
export class AppModule {}
