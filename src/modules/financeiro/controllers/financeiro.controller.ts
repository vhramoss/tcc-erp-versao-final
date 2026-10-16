import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../../common/decorators/current-user.decorator';
import { CreateFinanceiroDto, FiltroFluxoCaixaDto } from '../dto/financeiro.dto';
import { FinanceiroService } from '../services/financeiro.service';

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Post('transacao')
  criar(@CurrentUser() user: UserContext, @Body() dto: CreateFinanceiroDto) {
    return this.financeiroService.criarTransacao(user, dto);
  }

  @Patch('baixa/:id')
  darBaixa(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.financeiroService.darBaixa(user, id);
  }

  @Get('fluxo-caixa')
  getFluxoCaixa(@CurrentUser() user: UserContext, @Query() dto: FiltroFluxoCaixaDto) {
    return this.financeiroService.getFluxoCaixa(user, dto.dataInicio, dto.dataFim);
  }
}