import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { FormasPagamentoService } from '../services/formas-pagamento.service';
import { CreateFormaPagamentoDto } from '../dto/create-forma-pagamento.dto';

@Controller('formas-pagamento')
export class FormasPagamentoController {
  constructor(private readonly service: FormasPagamentoService) {}

  @Post()
  create(@Body() dto: CreateFormaPagamentoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('idEmpresa') idEmpresa: string) {
    return this.service.findAll(idEmpresa);
  }
}