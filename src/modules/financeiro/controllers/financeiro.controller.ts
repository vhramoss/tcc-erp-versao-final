import { Recurso } from '../../auth/auth.decorators';
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../../common/decorators/current-user.decorator';
import { BaixaFinanceiroDto, CreateFinanceiroDto, FiltroFluxoCaixaDto, FiltroTransacoesDto } from '../dto/financeiro.dto';
import { FinanceiroService } from '../services/financeiro.service';

@Controller('financeiro')
@Recurso('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Post('transacao')
  criar(@CurrentUser() user: UserContext, @Body() dto: CreateFinanceiroDto) {
    return this.financeiroService.criarTransacao(user, dto);
  }

  @Get('transacoes')
  listar(@CurrentUser() user: UserContext, @Query() filtro: FiltroTransacoesDto) {
    return this.financeiroService.listar(user, filtro);
  }

  @Patch('baixa/:id')
  darBaixa(@CurrentUser() user: UserContext, @Param('id', ParseUUIDPipe) id: string, @Body() dto: BaixaFinanceiroDto) {
    return this.financeiroService.darBaixa(user, id, dto?.dataPagamento);
  }

  @Patch('cancelar/:id')
  cancelar(@CurrentUser() user: UserContext, @Param('id', ParseUUIDPipe) id: string) {
    return this.financeiroService.cancelar(user, id);
  }

  @Get('fluxo-caixa')
  getFluxoCaixa(@CurrentUser() user: UserContext, @Query() dto: FiltroFluxoCaixaDto) {
    return this.financeiroService.getFluxoCaixa(user, dto.dataInicio, dto.dataFim);
  }
}
