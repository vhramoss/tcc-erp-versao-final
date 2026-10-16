import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateAlmoxarifadoDto } from '../dto/almoxarifado.dto';

@Injectable()
export class AlmoxarifadoService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAlmoxarifadoDto) {
    const existe = await this.prisma.almoxarifado.findUnique({
      where: {
        idEmpresa_nome: {
          idEmpresa: dto.idEmpresa,
          nome: dto.nome,
        },
      },
    });

    if (existe) {
      throw new ConflictException('Já existe um almoxarifado com este nome para esta empresa.');
    }

    return this.prisma.almoxarifado.create({
      data: {
        nome: dto.nome,
        idEmpresa: dto.idEmpresa,
        ativo: dto.ativo ?? true,
      },
    });
  }

  async findAll(idEmpresa: string) {
    return this.prisma.almoxarifado.findMany({
      where: { idEmpresa },
    });
  }
}