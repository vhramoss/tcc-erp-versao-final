import { Recurso } from '../../auth/auth.decorators';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../../common/decorators/current-user.decorator';
import { CreateFormaPagamentoDto } from '../dto/create-forma-pagamento.dto';
import { FormasPagamentoService } from '../services/formas-pagamento.service';

@Controller('formas-pagamento')
@Recurso('financeiro')
export class FormasPagamentoController {
  constructor(private readonly service: FormasPagamentoService) {}

  @Post()
  create(@CurrentUser() user: UserContext, @Body() dto: CreateFormaPagamentoDto) {
    return this.service.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserContext) {
    return this.service.findAll(user);
  }
}