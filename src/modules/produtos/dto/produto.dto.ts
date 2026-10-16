// @ts-nocheck
import { IsString, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export class CreateCategoriaDto {
  @IsString()
  @IsNotEmpty()
  nome: string;
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

  @IsNumber()
  @Min(0)
  precoCusto: number;

  @IsNumber()
  @Min(0)
  precoVenda: number;

  @IsNumber()
  @Min(0)
  estoqueMinimo: number;

  @IsString()
  @IsNotEmpty()
  categoriaId: string;
}