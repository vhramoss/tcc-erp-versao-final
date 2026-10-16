import { Injectable } from '@nestjs/common';
import { UserContext } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePlanoContasDto } from '../dto/create-plano-contas.dto';

@Injectable()
export class PlanoContasService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: UserContext, dto: CreatePlanoContasDto) {
    return this.prisma.planoContas.create({
      data: { idEmpresa: user.idEmpresa, codigo: dto.codigo.trim(), nome: dto.nome.trim(), tipo: dto.tipo },
    });
  }

  findAll(user: UserContext) {
    return this.prisma.planoContas.findMany({ where: { idEmpresa: user.idEmpresa }, orderBy: { codigo: 'asc' } });
  }
}