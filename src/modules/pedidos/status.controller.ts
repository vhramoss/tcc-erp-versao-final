import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';
import { CreateStatusPedidoDto, CreateStatusProdutoDto, UpdateStatusDto } from './status.dto';
import { StatusService } from './status.service';

@Controller('pedidos/status')
export class StatusController {
  constructor(private readonly service: StatusService) {}
  @Post('pedido') criarPedido(@CurrentUser() user: UserContext, @Body() dto: CreateStatusPedidoDto) { return this.service.criarPedido(user, dto); }
  @Get('pedido') listarPedidos(@CurrentUser() user: UserContext) { return this.service.listarPedidos(user); }
  @Patch('pedido/:id') atualizarPedido(@CurrentUser() user: UserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStatusDto) { return this.service.atualizarPedido(user, id, dto); }
  @Post('produto') criarProduto(@CurrentUser() user: UserContext, @Body() dto: CreateStatusProdutoDto) { return this.service.criarProduto(user, dto); }
  @Get('produto') listarProdutos(@CurrentUser() user: UserContext) { return this.service.listarProdutos(user); }
  @Patch('produto/:id') atualizarProduto(@CurrentUser() user: UserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStatusDto) { return this.service.atualizarProduto(user, id, dto); }
}
