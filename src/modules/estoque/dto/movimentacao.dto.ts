import { IsString, IsNotEmpty, IsNumber, Min, IsEnum } from 'class-validator';

export enum TipoMovimentacao {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
}

export class CreateMovimentacaoDto {
  @IsString()
  @IsNotEmpty()
  produtoId: string;

  @IsNumber()
  @Min(0.001)
  quantidade: number;

  @IsEnum(TipoMovimentacao)
  tipo: TipoMovimentacao;

  @IsString()
  @IsNotEmpty()
  observacao: string;
}
