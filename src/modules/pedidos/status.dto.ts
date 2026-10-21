import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateStatusProdutoDto {
  @IsString() @IsNotEmpty() @MaxLength(100) nome: string;
  @IsOptional() @IsInt() @Min(0) ordem?: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
}
export class CreateStatusPedidoDto extends CreateStatusProdutoDto {
  @IsOptional() @IsBoolean() ehInicial?: boolean;
  @IsOptional() @IsBoolean() ehFinal?: boolean;
  @IsOptional() @IsBoolean() ehCancelamento?: boolean;
}
// A semântica de finalização/cancelamento é preservada para pedidos já gravados.
export class UpdateStatusDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) nome?: string;
  @IsOptional() @IsInt() @Min(0) ordem?: number;
  @IsOptional() @IsBoolean() ativo?: boolean;
}
