import { Recurso } from '../auth/auth.decorators';
import { Controller, Get } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';
import { EstoqueAlertService } from './estoque-alert.service';

@Controller('estoque/alertas')
@Recurso('estoque')
export class EstoqueAlertController {
  constructor(private readonly alertService: EstoqueAlertService) {}

  @Get()
  getAlerts(@CurrentUser() user: UserContext) {
    return this.alertService.getProdutosAbaixoDoMinimo(user);
  }
}