import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFormaPagamentoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsBoolean()
  @IsOptional()
  ativo?: boolean;
}