import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EstoqueAlertController } from './estoque-alert.controller';
import { EstoqueAlertService } from './estoque-alert.service';
import { EstoqueController } from './estoque.controller';
import { EstoqueService } from './estoque.service';
import { EstoqueConsultaService } from './estoque-consulta.service';

@Module({
  imports: [PrismaModule],
  controllers: [EstoqueController, EstoqueAlertController],
  providers: [EstoqueService, EstoqueAlertService, EstoqueConsultaService],
  exports: [EstoqueService, EstoqueAlertService],
})
export class EstoqueModule {}