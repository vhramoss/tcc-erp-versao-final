import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateFormaPagamentoDto {
  @IsString()
  @IsNotEmpty()
  idEmpresa: string;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}