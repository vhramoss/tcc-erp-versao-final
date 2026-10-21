import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EstoqueModule } from '../estoque/estoque.module';
import { ComprasController } from './compras.controller';
import { ComprasService } from './compras.service';
import { FornecedoresController } from './fornecedores.controller';
import { FornecedoresService } from './fornecedores.service';

@Module({ imports: [PrismaModule, EstoqueModule], controllers: [ComprasController, FornecedoresController], providers: [ComprasService, FornecedoresService] })
export class ComprasModule {}
