import { Controller, Post, Patch, Get, Body, Param, Query, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { FinanceiroService } from '../services/financeiro.service';
import { CreateFinanceiroDto, FiltroFluxoCaixaDto } from '../dto/financeiro.dto';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';

@Controller('financeiro')
export class FinanceiroController {
  constructor(private readonly financeiroService: FinanceiroService) {}

  @Post('transacao')
  @UseInterceptors(ValidationPipe)
  async criar(@CurrentUser() user: UserContext, @Body() dto: CreateFinanceiroDto) {
    return this.financeiroService.criarTransacao(user, dto);
  }

  @Patch('baixa/:id')
  async darBaixa(@CurrentUser() user: UserContext, @Param('id') id: string) {
    return this.financeiroService.darBaixa(user, id);
  }

  @Get('fluxo-caixa')
  @UseInterceptors(ValidationPipe)
  async getFluxoCaixa(
    @CurrentUser() user: UserContext,
    @Query() dto: FiltroFluxoCaixaDto
  ) {
    return this.financeiroService.getFluxoCaixa(
      user,
      dto.dataInicio,
      dto.dataFim
    );
  }
}
