import { Body, Controller, Post } from '@nestjs/common';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';
import { CreateMovimentacaoDto } from './dto/movimentacao.dto';
import { EstoqueService } from './estoque.service';

@Controller('estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Post('movimentacao')
  movimentar(@CurrentUser() user: UserContext, @Body() dto: CreateMovimentacaoDto) {
    return this.estoqueService.registrarMovimentacao(user, dto);
  }
}