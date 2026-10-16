import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { CentroCustoService } from '../services/centro-custo.service';
import { CreateCentroCustoDto } from '../dto/create-centro-custo.dto';

@Controller('centros-custo')
export class CentroCustoController {
  constructor(private readonly service: CentroCustoService) {}

  @Post()
  create(@Body() dto: CreateCentroCustoDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('idEmpresa') idEmpresa: string) {
    return this.service.findAll(idEmpresa);
  }
}