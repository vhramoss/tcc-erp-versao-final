import { Recurso } from '../auth/auth.decorators';
import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';
import { CreateCompraDto } from './compras.dto';
import { ComprasService } from './compras.service';

@Controller('compras')
@Recurso('compras')
export class ComprasController {
  constructor(private readonly service: ComprasService) {}
  @Post() criar(@CurrentUser() user: UserContext, @Body() dto: CreateCompraDto) { return this.service.criar(user, dto); }
  @Get() listar(@CurrentUser() user: UserContext) { return this.service.listar(user); }
  @Get(':id') buscar(@CurrentUser() user: UserContext, @Param('id', ParseUUIDPipe) id: string) { return this.service.buscar(user, id); }
}
