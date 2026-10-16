import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateProdutoDto,
  CreateCategoriaDto,
  CreateMarcaDto,
  CreateUnidadeMedidaDto,
} from '../dto/produto.dto';
import { UserContext } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class ProdutosService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------- categorias

  async createCategoria(user: UserContext, dto: CreateCategoriaDto) {
    return this.prisma.categoriaProduto.create({
      data: { nome: dto.nome, idEmpresa: user.idEmpresa },
    });
  }

  async findAllCategorias(user: UserContext) {
    return this.prisma.categoriaProduto.findMany({
      where: { idEmpresa: user.idEmpresa },
      orderBy: { nome: 'asc' },
    });
  }

  // ---------------------------------------------------------------- marcas

  async createMarca(user: UserContext, dto: CreateMarcaDto) {
    return this.prisma.marca.create({
      data: { nome: dto.nome, idEmpresa: user.idEmpresa },
    });
  }

  async findAllMarcas(user: UserContext) {
    return this.prisma.marca.findMany({
      where: { idEmpresa: user.idEmpresa },
      orderBy: { nome: 'asc' },
    });
  }

  // ---------------------------------------------------------------- unidades de medida

  async createUnidadeMedida(user: UserContext, dto: CreateUnidadeMedidaDto) {
    return this.prisma.unidadeMedida.create({
      data: { sigla: dto.sigla.toUpperCase(), nome: dto.nome, idEmpresa: user.idEmpresa },
    });
  }

  async findAllUnidadesMedida(user: UserContext) {
    return this.prisma.unidadeMedida.findMany({
      where: { idEmpresa: user.idEmpresa },
      orderBy: { sigla: 'asc' },
    });
  }

  // ---------------------------------------------------------------- produtos

  async createProduto(user: UserContext, dto: CreateProdutoDto) {
    const { idEmpresa } = user;
    const { precoVenda, ...produtoData } = dto;

    // VALIDAÇÃO DE PERTINÊNCIA: categoria, unidade e marca devem ser da mesma empresa
    const [categoria, unidade, marca] = await Promise.all([
      this.prisma.categoriaProduto.findFirst({ where: { id: dto.categoriaId, idEmpresa } }),
      this.prisma.unidadeMedida.findFirst({ where: { id: dto.unidadeMedidaId, idEmpresa } }),
      dto.marcaId ? this.prisma.marca.findFirst({ where: { id: dto.marcaId, idEmpresa } }) : null,
    ]);

    if (!categoria) throw new BadRequestException('A categoria informada não pertence à sua empresa.');
    if (!unidade) throw new BadRequestException('A unidade de medida informada não pertence à sua empresa.');
    if (dto.marcaId && !marca) throw new BadRequestException('A marca informada não pertence à sua empresa.');

    // TRANSAÇÃO ACID: cria o produto e o preço padrão simultaneamente
    return this.prisma.$transaction(async (tx) => {
      const produto = await tx.produto.create({
        data: { ...produtoData, idEmpresa },
      });

      await tx.precoProduto.create({
        data: {
          idEmpresa,
          produtoId: produto.id,
          nomeTabela: 'Padrão',
          precoVenda,
        },
      });

      return produto;
    });
  }

  async findAllProdutos(user: UserContext) {
    return this.prisma.produto.findMany({
      where: { idEmpresa: user.idEmpresa },
      include: {
        categoria: true,
        unidadeMedida: true,
        marca: true,
        precos: true,
      },
      orderBy: { nome: 'asc' },
    });
  }
}
