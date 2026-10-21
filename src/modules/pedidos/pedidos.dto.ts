import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, ArrayUnique, IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { REGEX_DATA } from '../../common/utils/datas';

export class ItemPedidoDto {
  @IsUUID() produtoId: string;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(999999999.999) quantidade: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0.01) @Max(99999999.99) valorUnitario?: number;
  @IsOptional() @IsUUID() statusId?: string;
}

export class CreatePedidoDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(100) referencia?: string;
  @IsUUID() clienteId: string;
  @IsUUID() almoxarifadoId: string;
  @Matches(REGEX_DATA) dataVencimento: string;
  @IsOptional() @IsUUID() statusId?: string;
  @IsOptional() @IsUUID() formaPagamentoId?: string;
  @IsOptional() @IsUUID() planoContasId?: string;
  @IsOptional() @IsUUID() centroCustoId?: string;
  @IsOptional() @IsString() @MaxLength(1000) observacao?: string;
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(100)
  @ArrayUnique((item: ItemPedidoDto) => item.produtoId)
  @ValidateNested({ each: true }) @Type(() => ItemPedidoDto)
  itens: ItemPedidoDto[];
}

export class AlterarStatusDto { @IsUUID() statusId: string; }

export class FiltroPedidosDto {
  @IsOptional() @IsUUID() statusId?: string;
  @IsOptional() @IsUUID() clienteId?: string;
  @IsOptional() @Matches(REGEX_DATA) dataInicio?: string;
  @IsOptional() @Matches(REGEX_DATA) dataFim?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
