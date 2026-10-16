import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserContext } from '../../common/decorators/current-user.decorator';

@Injectable()
export class EstoqueAlertService {
  constructor(private prisma: PrismaService) {}

  async getProdutosAbaixoDoMinimo(user: UserContext) {
    const { idEmpresa } = user;

    // Busca produtos onde o saldo atual no estoque é <= estoqueMinimo
    // Utilizamos um join entre Produto e Estoque
    const produtosComEstoque = await this.prisma.produto.findMany({
      where: {
        idEmpresa,
        estoques: {
          some: {
            // Aqui simulamos a comparação. No PostgreSQL real,
            // para comparar duas colunas de tabelas diferentes no where,
            // poderíamos usar raw query ou filtrar no service.
          },
        },
      },
      include: { estoques: true },
    });

    // Filtro preciso de saldo <= estoqueMinimo
    return produtosComEstoque.filter(p => {
      const saldo = p.estoques[0]?.quantidade || 0;
      return Number(saldo) <= Number(p.estoqueMinimo);
    }).map(p => ({
      produtoId: p.id,
      nome: p.nome,
      saldoAtual: p.estoques[0]?.quantidade,
      estoqueMinimo: p.estoqueMinimo
    }));
  }
}
