import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../../common/decorators/current-user.decorator';
import {
  CreateCategoriaDto,
  CreateMarcaDto,
  CreateProdutoDto,
  CreateUnidadeMedidaDto,
} from '../dto/produto.dto';
import { ProdutosService } from '../services/produtos.service';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Post('categoria')
  createCategoria(@CurrentUser() user: UserContext, @Body() dto: CreateCategoriaDto) {
    return this.produtosService.createCategoria(user, dto);
  }

  @Get('categorias')
  findCategorias(@CurrentUser() user: UserContext) {
    return this.produtosService.findAllCategorias(user);
  }

  @Post('marca')
  createMarca(@CurrentUser() user: UserContext, @Body() dto: CreateMarcaDto) {
    return this.produtosService.createMarca(user, dto);
  }

  @Get('marcas')
  findMarcas(@CurrentUser() user: UserContext) {
    return this.produtosService.findAllMarcas(user);
  }

  @Post('unidade-medida')
  createUnidade(@CurrentUser() user: UserContext, @Body() dto: CreateUnidadeMedidaDto) {
    return this.produtosService.createUnidadeMedida(user, dto);
  }

  @Get('unidades-medida')
  findUnidades(@CurrentUser() user: UserContext) {
    return this.produtosService.findAllUnidadesMedida(user);
  }

  @Post()
  createProduto(@CurrentUser() user: UserContext, @Body() dto: CreateProdutoDto) {
    return this.produtosService.createProduto(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserContext) {
    return this.produtosService.findAllProdutos(user);
  }
}
