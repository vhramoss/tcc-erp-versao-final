import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePlanoContasDto } from '../dto/create-plano-contas.dto';

@Injectable()
export class PlanoContasService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreatePlanoContasDto) {
    return this.prisma.planoContas.create({ data: dto });
  }

  findAll(idEmpresa: string) {
    return this.prisma.planoContas.findMany({ where: { idEmpresa } });
  }
}