import { ConflictException, Injectable } from '@nestjs/common';
import { UserContext } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAlmoxarifadoDto } from '../dto/almoxarifado.dto';

@Injectable()
export class AlmoxarifadoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserContext, dto: CreateAlmoxarifadoDto) {
    const idEmpresa = user.idEmpresa;
    const nome = dto.nome.trim();
    const existe = await this.prisma.almoxarifado.findUnique({
      where: { idEmpresa_nome: { idEmpresa, nome } },
    });
    if (existe) throw new ConflictException('Já existe um almoxarifado com este nome para esta empresa.');

    return this.prisma.almoxarifado.create({
      data: { idEmpresa, nome, ativo: dto.ativo ?? true },
    });
  }

  findAll(user: UserContext) {
    return this.prisma.almoxarifado.findMany({
      where: { idEmpresa: user.idEmpresa },
      orderBy: { nome: 'asc' },
    });
  }
}