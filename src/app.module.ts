import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { EstoqueModule } from './modules/estoque/estoque.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';
import { PessoasModule } from './modules/pessoas/clientes.module';
import { TesourariaModule } from './modules/tesouraria/tesouraria.module';
import { AlmoxarifadoModule } from './modules/logistica/almoxarifado.module';
import { AuthModule } from './modules/auth/auth.module';
import { ComprasModule } from './modules/compras/compras.module';
import { PedidosModule } from './modules/pedidos/pedidos.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
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
  providers: [],
})
export class AppModule {}
