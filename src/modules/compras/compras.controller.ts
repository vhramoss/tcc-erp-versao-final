import { IdBancoPipe } from '../../common/decorators/id-banco.decorator';
import { Recurso } from '../auth/auth.decorators';
import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';
import { CreateCompraDto } from './compras.dto';
import { ComprasService } from './compras.service';

@Controller('compras')
@Recurso('compras')
export class ComprasController {
  constructor(private readonly service: ComprasService) {}
  @Post() criar(@CurrentUser() user: UserContext, @Body() dto: CreateCompraDto) { return this.service.criar(user, dto); }
  @Get() listar(@CurrentUser() user: UserContext) { return this.service.listar(user); }
  @Get(':id') buscar(@CurrentUser() user: UserContext, @Param('id', IdBancoPipe) id: number) { return this.service.buscar(user, id); }
}
