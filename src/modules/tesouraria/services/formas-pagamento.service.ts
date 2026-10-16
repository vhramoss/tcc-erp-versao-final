import { Injectable } from '@nestjs/common';
import { UserContext } from '../../../common/decorators/current-user.decorator';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFormaPagamentoDto } from '../dto/create-forma-pagamento.dto';

@Injectable()
export class FormasPagamentoService {
  constructor(private readonly prisma: PrismaService) {}

  create(user: UserContext, dto: CreateFormaPagamentoDto) {
    return this.prisma.formaPagamento.create({
      data: { idEmpresa: user.idEmpresa, nome: dto.nome.trim(), ativo: dto.ativo ?? true },
    });
  }

  findAll(user: UserContext) {
    return this.prisma.formaPagamento.findMany({ where: { idEmpresa: user.idEmpresa }, orderBy: { nome: 'asc' } });
  }
}