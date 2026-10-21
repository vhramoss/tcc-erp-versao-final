import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, Min } from 'class-validator';
import { REGEX_DATA } from '../../../common/utils/datas';

export enum TipoTransacao {
  RECEITA = 'RECEITA',
  DESPESA = 'DESPESA',
}

// "Atrasado" não é um status gravado: é derivado (PENDENTE com vencimento anterior a hoje).
export enum StatusTransacao {
  PENDENTE = 'PENDENTE',
  PAGO = 'PAGO',
  CANCELADO = 'CANCELADO',
}

const MSG_DATA = 'Use o formato AAAA-MM-DD.';

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

  @Matches(REGEX_DATA, { message: MSG_DATA })
  dataVencimento: string;

  // Pela criação manual só é possível PENDENTE ou PAGO. Cancelar tem endpoint próprio.
  @IsOptional()
  @IsIn([StatusTransacao.PENDENTE, StatusTransacao.PAGO])
  status?: StatusTransacao;

  @IsOptional()
  @Matches(REGEX_DATA, { message: MSG_DATA })
  dataPagamento?: string;

  @IsOptional()
  @IsUUID()
  planoContasId?: string;

  @IsOptional()
  @IsUUID()
  centroCustoId?: string;

  @IsOptional()
  @IsUUID()
  formaPagamentoId?: string;
}

export class BaixaFinanceiroDto {
  @IsOptional()
  @Matches(REGEX_DATA, { message: MSG_DATA })
  dataPagamento?: string;
}

export class FiltroFluxoCaixaDto {
  @Matches(REGEX_DATA, { message: MSG_DATA })
  dataInicio: string;

  @Matches(REGEX_DATA, { message: MSG_DATA })
  dataFim: string;
}

export class FiltroTransacoesDto {
  @IsOptional()
  @IsEnum(StatusTransacao)
  status?: StatusTransacao;

  @IsOptional()
  @IsEnum(TipoTransacao)
  tipo?: TipoTransacao;

  // Filtra pela data de vencimento
  @IsOptional()
  @Matches(REGEX_DATA, { message: MSG_DATA })
  dataInicio?: string;

  @IsOptional()
  @Matches(REGEX_DATA, { message: MSG_DATA })
  dataFim?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
