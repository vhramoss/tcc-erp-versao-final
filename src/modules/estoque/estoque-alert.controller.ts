import { Controller, Get } from '@nestjs/common';
import { EstoqueAlertService } from './estoque-alert.service';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';

@Controller('estoque/alertas')
export class EstoqueAlertController {
  constructor(private readonly alertService: EstoqueAlertService) {}

  @Get()
  async getAlerts(@CurrentUser() user: UserContext) {
    return this.alertService.getProdutosAbaixoDoMinimo(user);
  }
}
