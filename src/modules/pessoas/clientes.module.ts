import { Module } from '@nestjs/common';
import { ClientesController } from './controllers/clientes.controller'; // Ajuste o caminho se necessário conforme sua árvore
import { ClientesService } from './services/clientes.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ClientesController],
  providers: [ClientesService],
})
export class PessoasModule {}