import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../../common/decorators/current-user.decorator';
import { CreatePlanoContasDto } from '../dto/create-plano-contas.dto';
import { PlanoContasService } from '../services/plano-contas.service';

@Controller('plano-contas')
export class PlanoContasController {
  constructor(private readonly service: PlanoContasService) {}

  @Post()
  create(@CurrentUser() user: UserContext, @Body() dto: CreatePlanoContasDto) {
    return this.service.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserContext) {
    return this.service.findAll(user);
  }
}