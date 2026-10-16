import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateProdutoDto, CreateCategoriaDto } from '../dto/produto.dto';
import { UserContext } from '../../../common/decorators/current-user.decorator';

@Injectable()
export class ProdutosService {
  constructor(private prisma: PrismaService) {}

  async createCategoria(user: UserContext, dto: CreateCategoriaDto) {
    return this.prisma.categoriaProduto.create({
      data: {
        ...dto,
        idEmpresa: user.idEmpresa,
      },
    });
  }

  async createProduto(user: UserContext, dto: CreateProdutoDto) {
    const { idEmpresa } = user;
    const { precoVenda, ...produtoData } = dto;

    // VALIDAÇÃO DE PERTINÊNCIA: Categoria deve pertencer à mesma empresa
    const categoria = await this.prisma.categoriaProduto.findFirst({
      where: { id: dto.categoriaId, idEmpresa },
    });

    if (!categoria) {
      throw new BadRequestException('A categoria informada não pertence à sua empresa.');
    }

    // TRANSAÇÃO ACID: Cria o produto e o preço padrão simultaneamente
    return this.prisma.$transaction(async (tx) => {
      const produto = await tx.produto.create({
        data: {
          ...produtoData,
          idEmpresa,
        },
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
        precos: true, // Inclui os preços cadastrados para o produto na listagem
      },
    });
  }

  async findAllCategorias(user: UserContext) {
    return this.prisma.categoriaProduto.findMany({
      where: { idEmpresa: user.idEmpresa },
    });
  }
}