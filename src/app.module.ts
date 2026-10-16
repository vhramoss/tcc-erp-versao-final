import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { ProdutosModule } from './modules/produtos/produtos.module';
import { EstoqueModule } from './modules/estoque/estoque.module';
import { FinanceiroModule } from './modules/financeiro/financeiro.module';

@Module({
  imports: [
    PrismaModule,
    ProdutosModule,
    EstoqueModule,
    FinanceiroModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}