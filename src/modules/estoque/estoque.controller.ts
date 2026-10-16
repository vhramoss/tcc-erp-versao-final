import { Controller, Post, Body, UseGuards, UseInterceptors, ValidationPipe } from '@nestjs/common';
import { EstoqueService } from './estoque.service';
import { CreateMovimentacaoDto } from './dto/movimentacao.dto';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';

@Controller('estoque')
export class EstoqueController {
  constructor(private readonly estoqueService: EstoqueService) {}

  @Post('movimentacao')
  @UseInterceptors(ValidationPipe) // Garante validações do class-validator
  async movimentar(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateMovimentacaoDto
  ) {
    return await this.estoqueService.registrarMovimentacao(user, dto);
  }
}
