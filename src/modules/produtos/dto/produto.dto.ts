import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateCategoriaDto {
  @IsString()
  @IsNotEmpty()
  nome: string;
}

export class CreateMarcaDto {
  @IsString()
  @IsNotEmpty()
  nome: string;
}

export class CreateUnidadeMedidaDto {
  @IsString()
  @IsNotEmpty()
  sigla: string; // Ex: "UN", "KG"

  @IsString()
  @IsNotEmpty()
  nome: string; // Ex: "Unidade", "Quilograma"
}

export class CreateProdutoDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsString()
  @IsNotEmpty()
  sku: string;

  @IsOptional()
  @IsString()
  referencia?: string;

  @IsOptional()
  @IsString()
  cor?: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precoCusto: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precoVenda: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  estoqueMinimo: number;

  @IsUUID()
  categoriaId: string;

  @IsUUID()
  unidadeMedidaId: string;

  @IsOptional()
  @IsUUID()
  marcaId?: string;
}
