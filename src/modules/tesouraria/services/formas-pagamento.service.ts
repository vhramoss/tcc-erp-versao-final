import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateFormaPagamentoDto } from '../dto/create-forma-pagamento.dto';

@Injectable()
export class FormasPagamentoService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateFormaPagamentoDto) {
    return this.prisma.formaPagamento.create({ data: dto });
  }

  findAll(idEmpresa: string) {
    return this.prisma.formaPagamento.findMany({ where: { idEmpresa } });
  }
}