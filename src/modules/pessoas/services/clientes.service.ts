import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePessoaDto, UpdatePessoaDto } from '../dto/pessoa.dto';
import { UserContext } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class ClientesService {
  constructor(private prisma: PrismaService) {}

  async create(user: UserContext, dto: CreatePessoaDto) {
    const { idEmpresa } = user;

    return this.prisma.$transaction(async (tx) => {
      // 1. Cria a Pessoa primeiro
      const pessoa = await tx.pessoa.create({
        data: { ...dto, idEmpresa },
      });

      // 2. Vincula como Cliente
      return tx.cliente.create({
        data: { idEmpresa, pessoaId: pessoa.id },
        include: { pessoa: true },
      });
    });
  }

  async findAll(user: UserContext) {
    return this.prisma.cliente.findMany({
      where: { idEmpresa: user.idEmpresa },
      include: { pessoa: true },
    });
  }

  async findOne(user: UserContext, id: string) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, idEmpresa: user.idEmpresa },
      include: { pessoa: true },
    });

    if (!cliente) throw new NotFoundException('Cliente não encontrado.');
    return cliente;
  }

  async update(user: UserContext, id: string, dto: UpdatePessoaDto) {
    // findOne já garante que o cliente pertence à empresa do usuário
    const cliente = await this.findOne(user, id);

    return this.prisma.pessoa.update({
      where: { id: cliente.pessoaId },
      data: dto,
    });
  }

  async delete(user: UserContext, id: string) {
    const cliente = await this.findOne(user, id);

    // REGRA DE NEGÓCIO: impedir exclusão se houver pedidos
    const pedidosCount = await this.prisma.pedido.count({
      where: { clienteId: cliente.id, idEmpresa: user.idEmpresa },
    });

    if (pedidosCount > 0) {
      throw new BadRequestException('Não é possível excluir um cliente que possui pedidos associados.');
    }

    return this.prisma.cliente.delete({
      where: { id: cliente.id },
    });
  }
}
