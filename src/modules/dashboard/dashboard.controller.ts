import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';
import { Recurso } from '../auth/auth.decorators';
import { FiltroIndicadoresDto } from './dashboard.dto';
import { DashboardService } from './dashboard.service';

// Indicadores comerciais derivados dos pedidos. Margem e custo só saem para quem tem financeiro.ler.
@Controller('dashboard')
@Recurso('pedidos')
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('indicadores')
  indicadores(@CurrentUser() user: UserContext, @Query() filtro: FiltroIndicadoresDto) {
    return this.service.indicadores(user, filtro.dataInicio, filtro.dataFim);
  }
}
