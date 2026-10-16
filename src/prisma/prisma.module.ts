import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Deixa o Prisma global para você não precisar importar o PrismaModule em absolutamente todos os lugares
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}