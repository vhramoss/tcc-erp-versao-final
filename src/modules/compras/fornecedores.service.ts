import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';
import { CreatePessoaDto } from '../pessoas/dto/pessoa.dto';

@Injectable()
export class FornecedoresService {
  constructor(private readonly prisma: PrismaService) {}
  criar(user: UserContext, dto: CreatePessoaDto) {
    return this.prisma.$transaction(async (tx) => {
      const pessoa = await tx.pessoa.create({ data: { ...dto, idEmpresa: user.idEmpresa } });
      return tx.fornecedor.create({ data: { pessoaId: pessoa.id, idEmpresa: user.idEmpresa }, include: { pessoa: true } });
    });
  }
  async vincular(user: UserContext, pessoaId: string) {
    const pessoa = await this.prisma.pessoa.findFirst({ where: { id: pessoaId, idEmpresa: user.idEmpresa } });
    if (!pessoa) throw new NotFoundException('Pessoa não encontrada nesta empresa.');
    return this.prisma.fornecedor.create({ data: { pessoaId, idEmpresa: user.idEmpresa }, include: { pessoa: true } });
  }
  listar(user: UserContext) {
    return this.prisma.fornecedor.findMany({ where: { idEmpresa: user.idEmpresa }, include: { pessoa: true }, orderBy: { createdAt: 'desc' } });
  }
}
