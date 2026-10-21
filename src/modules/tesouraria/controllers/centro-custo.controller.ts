import { Recurso } from '../../auth/auth.decorators';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../../common/decorators/current-user.decorator';
import { CreateCentroCustoDto } from '../dto/create-centro-custo.dto';
import { CentroCustoService } from '../services/centro-custo.service';

@Controller('centros-custo')
@Recurso('financeiro')
export class CentroCustoController {
  constructor(private readonly service: CentroCustoService) {}

  @Post()
  create(@CurrentUser() user: UserContext, @Body() dto: CreateCentroCustoDto) {
    return this.service.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserContext) {
    return this.service.findAll(user);
  }
}