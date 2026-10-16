import { Type } from 'class-transformer';
import { IsDate, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum TipoTransacao {
  RECEITA = 'RECEITA',
  DESPESA = 'DESPESA',
}

export enum StatusTransacao {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  ATRASADO = 'ATRASADO',
  CANCELADO = 'CANCELADO',
}

export class CreateFinanceiroDto {
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  valor: number;

  @IsEnum(TipoTransacao)
  tipo: TipoTransacao;

  @Type(() => Date)
  @IsDate()
  dataVencimento: Date;

  @IsOptional()
  @IsString()
  pedidoId?: string;

  @IsOptional()
  @IsEnum(StatusTransacao)
  status?: StatusTransacao;
}

export class FiltroFluxoCaixaDto {
  @Type(() => Date)
  @IsDate()
  dataInicio: Date;

  @Type(() => Date)
  @IsDate()
  dataFim: Date;
}