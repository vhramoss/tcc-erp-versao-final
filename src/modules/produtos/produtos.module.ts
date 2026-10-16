import { Module } from '@nestjs/common';
import { ProdutosController } from './controllers/produtos.controller'; // Ajuste o caminho se necessário
import { ProdutosService } from './services/produtos.service';
import { PrismaModule } from '../../prisma/prisma.module'; // Ajuste o caminho se necessário

@Module({
  imports: [PrismaModule],
  controllers: [ProdutosController],
  providers: [ProdutosService],
})
export class ProdutosModule {}