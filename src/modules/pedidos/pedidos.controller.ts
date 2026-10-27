import { IdBancoPipe } from '../../common/decorators/id-banco.decorator';
import { Recurso } from '../auth/auth.decorators';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';
import { AlterarStatusDto, CreatePedidoDto, FiltroPedidosDto } from './pedidos.dto';
import { PedidosService } from './pedidos.service';

@Controller('pedidos')
@Recurso('pedidos')
export class PedidosController {
  constructor(private readonly service: PedidosService) {}
  @Post() criar(@CurrentUser() user: UserContext, @Body() dto: CreatePedidoDto) { return this.service.criar(user, dto); }
  @Get() listar(@CurrentUser() user: UserContext, @Query() filtro: FiltroPedidosDto) { return this.service.listar(user, filtro); }
  @Get(':id') buscar(@CurrentUser() user: UserContext, @Param('id', IdBancoPipe) id: number) { return this.service.buscar(user, id); }
  @Patch(':id/status') alterarStatus(@CurrentUser() user: UserContext, @Param('id', IdBancoPipe) id: number, @Body() dto: AlterarStatusDto) { return this.service.alterarStatus(user, id, dto.statusId); }
  @Patch(':id/itens/:itemId/status') alterarItem(@CurrentUser() user: UserContext, @Param('id', IdBancoPipe) id: number, @Param('itemId', IdBancoPipe) itemId: number, @Body() dto: AlterarStatusDto) { return this.service.alterarStatusItem(user, id, itemId, dto.statusId); }
}
