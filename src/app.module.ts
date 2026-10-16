import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { EstoqueModule } from './modules/estoque/estoque.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';
import { PessoasModule } from './modules/pessoas/clientes.module';
import { TesourariaModule } from './modules/tesouraria/tesouraria.module';
import { AlmoxarifadoModule } from './modules/logistica/almoxarifado.module';

@Module({
  imports: [
    PrismaModule,
    ProdutosModule,
    EstoqueModule,
    FinanceiroModule,
    PessoasModule,
    AlmoxarifadoModule,
    TesourariaModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}