import { IdBanco } from '../../common/decorators/id-banco.decorator';
import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { REGEX_DATA } from '../../common/utils/datas';

export class ItemCompraDto {
  @IdBanco() produtoId: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 3 }) @Min(0.001) @Max(999999999.999) quantidade: number;
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 10 }) @Min(0) @Max(99999999999) valorUnitario: number;
}

export class NotaEntradaDto {
  @Matches(/^\d{1,9}$/) numero: string;
  @Matches(/^\d{1,3}$/) serie: string;
  @Matches(REGEX_DATA) dataEmissao: string;
  @IsOptional() @Matches(/^\d{44}$/) chave?: string;
}

export class BaseCompraDto {
  @IsString() @IsNotEmpty() @MaxLength(100) referencia: string;
  @IdBanco() fornecedorId: number;
  @IdBanco() almoxarifadoId: number;
  @Matches(REGEX_DATA) dataVencimento: string;
  @IsOptional() @IdBanco() formaPagamentoId?: number;
  @IsOptional() @IsString() @MaxLength(1000) observacao?: string;
}

export class CreateCompraDto extends BaseCompraDto {
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(990) @ValidateNested({ each: true }) @Type(() => ItemCompraDto)
  itens: ItemCompraDto[];
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(9999999999.99) acrescimos?: number;
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(9999999999.99) desconto?: number;
  @IsOptional() @ValidateNested() @Type(() => NotaEntradaDto) nota?: NotaEntradaDto;
}
