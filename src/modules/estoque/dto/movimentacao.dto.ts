import { IdBanco } from '../../../common/decorators/id-banco.decorator';
import { Type } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export enum TipoMovimentacao {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
}

export class CreateMovimentacaoDto {
  @IdBanco()
  produtoId: number;

  // O saldo é controlado por produto e almoxarifado.
  @IdBanco()
  almoxarifadoId: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantidade: number;

  @IsEnum(TipoMovimentacao)
  tipo: TipoMovimentacao;

  @IsString()
  @IsNotEmpty()
  observacao: string;
}