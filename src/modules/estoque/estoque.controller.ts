import { Recurso } from '../auth/auth.decorators';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';
import { CreateMovimentacaoDto } from './dto/movimentacao.dto';
import { EstoqueService } from './estoque.service';
import { EstoqueConsultaService } from './estoque-consulta.service';
import { FiltroMovimentosDto, FiltroSaldosDto } from './estoque-consulta.dto';

@Controller('estoque')
@Recurso('estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService, private readonly consulta: EstoqueConsultaService) {}

  @Post('movimentacao')
  movimentar(@CurrentUser() user: UserContext, @Body() dto: CreateMovimentacaoDto) {
    return this.estoqueService.registrarMovimentacao(user, dto);
  }

  @Get('saldos')
  saldos(@CurrentUser() user: UserContext, @Query() filtro: FiltroSaldosDto) {
    return this.consulta.saldos(user, filtro);
  }

  @Get('movimentos')
  movimentos(@CurrentUser() user: UserContext, @Query() filtro: FiltroMovimentosDto) {
    return this.consulta.movimentos(user, filtro);
  }
}
