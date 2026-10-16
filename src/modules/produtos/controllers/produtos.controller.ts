import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../../common/decorators/current-user.decorator';
import { CreateCategoriaDto, CreateProdutoDto } from '../dto/produto.dto';
import { ProdutosService } from '../services/produtos.service';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Post('categoria')
  createCategoria(@CurrentUser() user: UserContext, @Body() dto: CreateCategoriaDto) {
    return this.produtosService.createCategoria(user, dto);
  }

  @Post()
  createProduto(@CurrentUser() user: UserContext, @Body() dto: CreateProdutoDto) {
    return this.produtosService.createProduto(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserContext) {
    return this.produtosService.findAllProdutos(user);
  }

  @Get('categorias')
  findCategorias(@CurrentUser() user: UserContext) {
    return this.produtosService.findAllCategorias(user);
  }
}