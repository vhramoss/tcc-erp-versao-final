import { IsString, IsNotEmpty, IsNumber, Min, IsEnum, IsDate, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum TipoTransacao {
  RECEITA = 'RECEITA',
  DESPESA = 'DESPESA',
}

export enum StatusTransacao {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  ATRASADO = 'ATRASADO',
}

export class CreateFinanceiroDto {
  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsNumber()
  @Min(0.01)
  valor: number;

  @IsEnum(TipoTransacao)
  tipo: TipoTransacao;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  dataVencimento: Date;

  @IsOptional()
  @IsString()
  pedidoId?: string;

  @IsOptional()
  @IsString()
  status?: StatusTransacao;
}

export class FiltroFluxoCaixaDto {
  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  dataInicio: Date;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  dataFim: Date;
}
