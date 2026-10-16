import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { PlanoContasService } from '../services/plano-contas.service';
import { CreatePlanoContasDto } from '../dto/create-plano-contas.dto';

@Controller('plano-contas')
export class PlanoContasController {
  constructor(private readonly service: PlanoContasService) {}

  @Post()
  create(@Body() dto: CreatePlanoContasDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query('idEmpresa') idEmpresa: string) {
    return this.service.findAll(idEmpresa);
  }
}