import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { AlmoxarifadoService } from '../services/almoxarifado.service';
import { CreateAlmoxarifadoDto } from '../dto/almoxarifado.dto';

@Controller('almoxarifados')
export class AlmoxarifadoController {
  constructor(private readonly almoxarifadoService: AlmoxarifadoService) {}

  @Post()
  create(@Body() dto: CreateAlmoxarifadoDto) {
    return this.almoxarifadoService.create(dto);
  }

  @Get()
  findAll(@Query('idEmpresa') idEmpresa: string) {
    return this.almoxarifadoService.findAll(idEmpresa);
  }
}