import { IdBanco } from '../../common/decorators/id-banco.decorator';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class FiltroSaldosDto {
  @IsOptional() @IsString() @MaxLength(100) busca?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}

export class FiltroMovimentosDto {
  @IsOptional() @IdBanco() produtoId?: number;
  @IsOptional() @IdBanco() almoxarifadoId?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
}
