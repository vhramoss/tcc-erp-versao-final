import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EstoqueAlertController } from './estoque-alert.controller';
import { EstoqueAlertService } from './estoque-alert.service';
import { EstoqueController } from './estoque.controller';
import { EstoqueService } from './estoque.service';

@Module({
  imports: [PrismaModule],
  controllers: [EstoqueController, EstoqueAlertController],
  providers: [EstoqueService, EstoqueAlertService],
  exports: [EstoqueService, EstoqueAlertService],
})
export class EstoqueModule {}