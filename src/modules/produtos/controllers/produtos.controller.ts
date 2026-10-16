import { Controller, Post, Get, Body, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { ProdutosService } from '../services/produtos.service';
import { CreateProdutoDto, CreateCategoriaDto } from '../dto/produto.dto';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';

@Controller('produtos')
export class ProdutosController {
  constructor(private readonly produtosService: ProdutosService) {}

  @Post('categoria')
  @UseInterceptors(ValidationPipe)
  async createCategoria(@CurrentUser() user: UserContext, @Body() dto: CreateCategoriaDto) {
    return this.produtosService.createCategoria(user, dto);
  }

  @Post()
  @UseInterceptors(ValidationPipe)
  async createProduto(@CurrentUser() user: UserContext, @Body() dto: CreateProdutoDto) {
    return this.produtosService.createProduto(user, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: UserContext) {
    return this.produtosService.findAllProdutos(user);
  }

  @Get('categorias')
  async findCategorias(@CurrentUser() user: UserContext) {
    return this.produtosService.findAllCategorias(user);
  }
}
