import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCentroCustoDto } from '../dto/create-centro-custo.dto';

@Injectable()
export class CentroCustoService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateCentroCustoDto) {
    return this.prisma.centroCusto.create({ data: dto });
  }

  findAll(idEmpresa: string) {
    return this.prisma.centroCusto.findMany({ where: { idEmpresa } });
  }
}