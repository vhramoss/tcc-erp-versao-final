import { Body, Controller, Get, Header, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';
import { Autenticado, Publica } from './auth.decorators';
import { LoginDto, RefreshDto, SenhaDto } from './auth.dto';
import { AuthService } from './auth.service';
import { AuthLimiteGuard } from './auth.guards';

@Controller('auth')
@Autenticado()
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('login') @Publica() @UseGuards(AuthLimiteGuard) @Header('Cache-Control', 'no-store')
  login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @Post('refresh') @Publica() @UseGuards(AuthLimiteGuard) @Header('Cache-Control', 'no-store')
  refresh(@Body() dto: RefreshDto) { return this.auth.renovar(dto.refreshToken); }
  @Post('logout') sair(@CurrentUser() user: UserContext) { return this.auth.sair(user); }
  @Post('logout-todos') sairTodos(@CurrentUser() user: UserContext) { return this.auth.sair(user, true); }
  @Get('me') @Header('Cache-Control', 'no-store') me(@CurrentUser() user: UserContext) { return this.auth.perfil(user); }
  @Patch('senha') @UseGuards(AuthLimiteGuard)
  senha(@CurrentUser() user: UserContext, @Body() dto: SenhaDto) { return this.auth.trocarSenha(user, dto); }
}
