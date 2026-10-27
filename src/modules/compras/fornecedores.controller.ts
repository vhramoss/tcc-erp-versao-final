import { IdBanco } from '../../common/decorators/id-banco.decorator';
import { Recurso } from '../auth/auth.decorators';
import { Body, Controller, Get, Post } from '@nestjs/common';
import { } from 'class-validator';
import { CurrentUser, UserContext } from '../../common/decorators/current-user.decorator';
import { CreatePessoaDto } from '../pessoas/dto/pessoa.dto';
import { FornecedoresService } from './fornecedores.service';

class VincularFornecedorDto { @IdBanco() pessoaId: number; }

@Controller('fornecedores')
@Recurso('compras')
export class FornecedoresController {
  constructor(private readonly service: FornecedoresService) {}
  @Post() criar(@CurrentUser() user: UserContext, @Body() dto: CreatePessoaDto) { return this.service.criar(user, dto); }
  @Post('vincular') vincular(@CurrentUser() user: UserContext, @Body() dto: VincularFornecedorDto) { return this.service.vincular(user, dto.pessoaId); }
  @Get() listar(@CurrentUser() user: UserContext) { return this.service.listar(user); }
}
