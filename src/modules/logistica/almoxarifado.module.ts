import { Module } from '@nestjs/common';
import { AlmoxarifadoController } from './controller/almoxarifado.controller';
import { AlmoxarifadoService } from './services/almoxarifado.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AlmoxarifadoController],
  providers: [AlmoxarifadoService],
  exports: [AlmoxarifadoService],
})
export class AlmoxarifadoModule {}