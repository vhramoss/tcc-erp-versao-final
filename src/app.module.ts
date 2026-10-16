import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { EstoqueModule } from './modules/estoque/estoque.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';
import { PessoasModule } from './modules/pessoas/clientes.module';

@Module({
  imports: [
    PrismaModule,
    ProdutosModule,
    EstoqueModule,
    FinanceiroModule,
    PessoasModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}