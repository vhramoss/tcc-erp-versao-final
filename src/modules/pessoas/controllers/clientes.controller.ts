import { IdBancoPipe } from '../../../common/decorators/id-banco.decorator';
import { Recurso } from '../../auth/auth.decorators';
import { Body, Controller, Delete, Get, Param, Post, Put } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../../common/decorators/current-user.decorator';
import { CreatePessoaDto, UpdatePessoaDto } from '../dto/pessoa.dto';
import { ClientesService } from '../services/clientes.service';

@Controller('clientes')
@Recurso('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  create(@CurrentUser() user: UserContext, @Body() dto: CreatePessoaDto) {
    return this.clientesService.create(user, dto);
  }

  @Get()
  findAll(@CurrentUser() user: UserContext) {
    return this.clientesService.findAll(user);
  }

  @Get(':id')
  findOne(@CurrentUser() user: UserContext, @Param('id', IdBancoPipe) id: number) {
    return this.clientesService.findOne(user, id);
  }

  @Put(':id')
  update(@CurrentUser() user: UserContext, @Param('id', IdBancoPipe) id: number, @Body() dto: UpdatePessoaDto) {
    return this.clientesService.update(user, id, dto);
  }

  @Delete(':id')
  remove(@CurrentUser() user: UserContext, @Param('id', IdBancoPipe) id: number) {
    return this.clientesService.delete(user, id);
  }
}