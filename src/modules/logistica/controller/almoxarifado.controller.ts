import { Recurso } from '../../auth/auth.decorators';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../../common/decorators/current-user.decorator';
import { CreateAlmoxarifadoDto } from '../dto/almoxarifado.dto';
import { AlmoxarifadoService } from '../services/almoxarifado.service';

@Controller('almoxarifados')
@Recurso('estoque')
export class AlmoxarifadoController {
  constructor(private readonly almoxarifadoService: AlmoxarifadoService) {}

  @Post()
  create(@CurrentUser() user: UserContext, @Body() dto: CreateAlmoxarifadoDto) {
    return this.almoxarifadoService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserContext) {
    return this.almoxarifadoService.findAll(user);
  }
}