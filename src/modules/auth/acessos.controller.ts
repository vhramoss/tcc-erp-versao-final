import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';
import { Recurso } from './auth.decorators';
import { AcessosService } from './acessos.service';
import { AtualizarUsuarioDto, DepartamentoDto, PermissoesDto, UsuarioDto } from './auth.dto';

@Controller('acessos')
@Recurso('acessos')
export class AcessosController {
  constructor(private readonly service: AcessosService) {}
  @Get('permissoes') catalogo() { return this.service.catalogo(); }
  @Get('departamentos') departamentos(@CurrentUser() user: UserContext) { return this.service.departamentos(user); }
  @Post('departamentos') criarDepartamento(@CurrentUser() user: UserContext, @Body() dto: DepartamentoDto) { return this.service.criarDepartamento(user, dto); }
  @Put('departamentos/:id/permissoes') definirDepartamento(@CurrentUser() user: UserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PermissoesDto) { return this.service.definirDepartamento(user, id, dto.permissoes); }
  @Get('usuarios') usuarios(@CurrentUser() user: UserContext) { return this.service.usuarios(user); }
  @Post('usuarios') criarUsuario(@CurrentUser() user: UserContext, @Body() dto: UsuarioDto) { return this.service.criarUsuario(user, dto); }
  @Put('usuarios/:id/permissoes') definirUsuario(@CurrentUser() user: UserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PermissoesDto) { return this.service.definirUsuario(user, id, dto.permissoes); }
  @Patch('usuarios/:id') atualizarUsuario(@CurrentUser() user: UserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AtualizarUsuarioDto) { return this.service.atualizarUsuario(user, id, dto); }
}
