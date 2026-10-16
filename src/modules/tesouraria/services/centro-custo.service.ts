import { Injectable } from '@nestjs/common';
import { UserContext } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateCentroCustoDto } from '../dto/create-centro-custo.dto';

@Injectable()
export class CentroCustoService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: UserContext, dto: CreateCentroCustoDto) {
    return this.prisma.centroCusto.create({ data: { nome: dto.nome.trim(), idEmpresa: user.idEmpresa } });
  }

  findAll(user: UserContext) {
    return this.prisma.centroCusto.findMany({ where: { idEmpresa: user.idEmpresa }, orderBy: { nome: 'asc' } });
  }
}