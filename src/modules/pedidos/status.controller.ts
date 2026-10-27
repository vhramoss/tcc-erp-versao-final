import { IdBancoPipe } from '../../common/decorators/id-banco.decorator';
import { Recurso } from '../auth/auth.decorators';
import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';
import { CreateStatusPedidoDto, CreateStatusProdutoDto, UpdateStatusDto } from './status.dto';
import { StatusService } from './status.service';

@Controller('pedidos/status')
@Recurso('pedidos')
export class StatusController {
  constructor(private readonly service: StatusService) {}
  @Post('pedido') criarPedido(@CurrentUser() user: UserContext, @Body() dto: CreateStatusPedidoDto) { return this.service.criarPedido(user, dto); }
  @Get('pedido') listarPedidos(@CurrentUser() user: UserContext) { return this.service.listarPedidos(user); }
  @Patch('pedido/:id') atualizarPedido(@CurrentUser() user: UserContext, @Param('id', IdBancoPipe) id: number, @Body() dto: UpdateStatusDto) { return this.service.atualizarPedido(user, id, dto); }
  @Post('produto') criarProduto(@CurrentUser() user: UserContext, @Body() dto: CreateStatusProdutoDto) { return this.service.criarProduto(user, dto); }
  @Get('produto') listarProdutos(@CurrentUser() user: UserContext) { return this.service.listarProdutos(user); }
  @Patch('produto/:id') atualizarProduto(@CurrentUser() user: UserContext, @Param('id', IdBancoPipe) id: number, @Body() dto: UpdateStatusDto) { return this.service.atualizarProduto(user, id, dto); }
}
