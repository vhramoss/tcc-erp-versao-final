import { IsString, IsNotEmpty, IsEmail, IsEnum, IsOptional } from 'class-validator';

export enum TipoPessoa {
  FISICA = 'FISICA',
  JURIDICA = 'JURIDICA',
}

export class CreatePessoaDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  cpfCnpj: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  endereco?: string;

  @IsEnum(TipoPessoa)
  @IsNotEmpty()
  tipo: TipoPessoa;
}

export class UpdatePessoaDto {
  @IsString()
  @IsOptional()
  nome?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  cpfCnpj?: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  endereco?: string;

  @IsEnum(TipoPessoa)
  @IsOptional()
  tipo?: TipoPessoa;
}
