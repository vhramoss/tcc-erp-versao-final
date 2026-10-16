import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { ClientesService } from '../services/clientes.service';
import { CreatePessoaDto, UpdatePessoaDto } from '../dto/pessoa.dto';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';

@Controller('clientes')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Post()
  @UseInterceptors(ValidationPipe)
  async create(@CurrentUser() user: UserContext, @Body() dto: CreatePessoaDto) {
    return this.clientesService.create(user, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: UserContext) {
    return this.clientesService.findAll(user);
  }

  @Get(':id')
  async findOne(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.clientesService.findOne(user, id);
  }

  @Put(':id')
  @UseInterceptors(ValidationPipe)
  async update(@CurrentUser() user: UserContext, @Param('id') id: string, @Body() dto: UpdatePessoaDto) {
    return this.clientesService.update(user, id, dto);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.clientesService.delete(user, id);
  }
}
